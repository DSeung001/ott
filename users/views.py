import random
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone


from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from users.auth_tokens import create_session_token, remove_session_token
from users.constants import (
    AUTH_CODE_TIMEOUT,
    EMAIL_VERIFIED_TIMEOUT,
    IDENTITY_VERIFIED_TIMEOUT,
    get_auth_code_cache_key,
    get_email_verified_cache_key,
    get_identity_verified_cache_key, SubscriptionStatus,
)
from users.models import Profile, Membership
from users.serializers import (
    SignUpSerializer,
    ProfileSerializer,
    UserSerializer,
    LoginSerializer,
    MembershipSerializer,
    SubscriptionSerializer,
    SubscriptionCreateSerializer,
    SubscriptionPlanChangeSerializer,
)
from users.subscription import get_current_subscription

User = get_user_model()


# APIView: View를 확장하여 RESTful API 구축을 지원하는 클래스 기반 뷰
# 클래스 기반 뷰(Class-Based View, CBV): 로직을 파이썬 클래스로 구현하는 방식
# 함수로 뷰를 작성하는 함수 기반 뷰(FBV)의 단점을 보완

# 이메일 체크
class EmailSignUpCheck(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response(
                {"error": "이메일이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        exists = User.objects.filter(email__iexact=email).exists()
        if exists:
            return Response(
                {"status": "EXIST", "message": "이미 가입된 이메일입니다. 비밀번호를 입력하세요."},
                status=status.HTTP_200_OK)
        else:
            return Response(
                {"status": "AVAILABLE", "message": "가입 가능한 이메일입니다. 이메일 인증을 진행해 주세요."},
                status=status.HTTP_200_OK)


# 이메일 인증 코드 발송
class EmailVerificationRequest(APIView):
    permission_classes = [AllowAny]

    # 인증 코드 발송
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "이메일이 필요합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 랜덤 코드
        code = str(random.randint(100000, 999999))

        if settings.DEBUG:
            print("\n" + "=" * 40)
            print(f"[DEVELOPMENT ONLY] 이메일 인증 번호 ({email}): {code}")
            print("=" * 40 + "\n")
        else:
            # 이메일 전송 로직
            pass

        cache.set(get_auth_code_cache_key(email), code, timeout=AUTH_CODE_TIMEOUT)
        return Response({"message": "인증 코드가 발송되었습니다. (유효시간 5분)"}, status=status.HTTP_200_OK)


# 이메일 인증 코드 인증
class EmailVerificationConfirm(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        saved_code = cache.get(get_auth_code_cache_key(email))
        if saved_code and saved_code == str(code):
            cache.set(
                get_email_verified_cache_key(email),
                True,
                timeout=EMAIL_VERIFIED_TIMEOUT,
            )
            return Response({"status": "SUCCESS", "message": "이메일 인증이 완료되었습니다."})
        else:
            return Response(
                {"status": "FAIL", "error": "인증번호가 일치하지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )


# 본인 인증 (Mock API 진행)
class IdentityVerificationMockView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        # Mock 데이터 처리
        name = request.data.get('name', 'tester')
        phone = request.data.get('phone', '010-1234-5678')

        if not email:
            return Response(
                {"error": "이메일 정보가 누락되었습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 본인 인증 처리 기록 저장
        cache.set(
            get_identity_verified_cache_key(email),
            name,
            timeout=IDENTITY_VERIFIED_TIMEOUT,
        )

        return Response({
            "status": "SUCCESS",
            "message": "본인인증이 완료되었습니다. (Mock Pass)",
            "data": {"name": name, "phone": phone}
        }, status=status.HTTP_200_OK)


# 회원 가입
class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        identity_name = cache.get(get_identity_verified_cache_key(email)) or ''

        is_verified_email = cache.get(get_email_verified_cache_key(email))
        is_identity_verified_email = cache.get(get_identity_verified_cache_key(email))
        if not is_verified_email or not is_identity_verified_email:
            return Response(
                {"error": "이메일 인증 및 본인인증이 완료되지 않았습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SignUpSerializer(
            data=request.data,
            context={'identity_name': identity_name},
        )
        if serializer.is_valid():
            user = serializer.save()
            token = create_session_token(user)  # hex 40자

            cache.delete(get_email_verified_cache_key(email))
            cache.delete(get_identity_verified_cache_key(email))

            return Response({
                "message": "회원가입이 완료되었습니다.",
                "user": UserSerializer(user).data,
                "token": token,  # localStorage에 이것만
                "method": "email",
                "is_registered": True,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 프로필 등록 및 수정
class ProfilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = request.user.profiles.order_by("created_at")
        serializer = ProfileSerializer(profiles, many=True)
        return Response({"profiles": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                "message": "프로필 등록이 완료되었습니다.",
                "profile": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile(self, request, pk):
        return get_object_or_404(Profile, pk=pk, user=request.user)

    def get(self, request, pk):
        profile = self.get_profile(request, pk)
        return Response(
            {"profile": ProfileSerializer(profile).data},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        profile = self.get_profile(request, pk)
        serializer = ProfileSerializer(instance=profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "프로필이 수정되었습니다.",
                    "profile": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 로그인
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token = create_session_token(user)
        return Response({
            "user": UserSerializer(user).data,
            "token": token,
            "method": "email",
            "is_registered": True,
        }, status=status.HTTP_200_OK)


# 로그 아웃
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        key = request.auth  # SessionTokenAuthentication이 넣어 줌
        if key:
            remove_session_token(key)
        return Response({"message": "로그아웃되었습니다."})


# 멤버쉽
class MembershipView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = Membership.objects.all().order_by("price")
        return Response({
            "plans": MembershipSerializer(plans, many=True).data,
        })

class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    # 현재 구독 여부
    def get(self, request):
        sub = get_current_subscription(request.user)
        return Response({
            "is_subscribed": sub is not None,
            "subscription": SubscriptionSerializer(sub).data if sub else None,
        })

    # 구독 하기
    def post(self, request):
        serializer = SubscriptionCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            subscription = serializer.save()

        return Response(
            {
                "message": "멤버십이 적용되었습니다.",
                "is_subscribed": True,
                "subscription": SubscriptionSerializer(subscription).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # 구독 변경
    def patch(self, request):
        sub = get_current_subscription(request.user)
        if not sub:
            return Response({"error": "구독 중이 아닙니다."}, status=400)

        # instance가 있어야 update로 흐름
        # 없으면 create를 찾음
        serializer = SubscriptionPlanChangeSerializer(
            instance=sub,
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # save가 내부에서 update, create를 찾음
        subscription = serializer.save()
        pending = subscription.pending_membership
        pending_name = pending.code if pending else ""
        return Response({
            "message": f"다음 결제일부터 {pending_name} 플랜이 적용됩니다.",
            "is_subscribed": True,
            "subscription": SubscriptionSerializer(subscription).data,
        })

    # 구독 해제
    def delete(self, request):
        sub = get_current_subscription(request.user)
        if not sub:
            return Response(
                {"error": "구독 중이 아닙니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        sub.status = SubscriptionStatus.ENDED
        sub.ended_at = now
        sub.next_billing_at = None
        sub.pending_membership = None
        sub.end_at = None
        sub.save(
            update_fields=[
                "status",
                "ended_at",
                "next_billing_at",
                "pending_membership",
                "end_at",
            ]
        )
        return Response({
            "message": "멤버십이 해지되었습니다.",
            "is_subscribed": False,
        })
