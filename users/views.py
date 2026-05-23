import random
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from django.conf import settings

from users.constants import (
    AUTH_CODE_TIMEOUT,
    EMAIL_VERIFIED_TIMEOUT,
    IDENTITY_VERIFIED_TIMEOUT,
    get_auth_code_cache_key,
    get_email_verified_cache_key,
    get_identity_verified_cache_key,
)
from users.serializers import SignUpSerializer, ProfileSerializer

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

        is_verified_email = cache.get(get_email_verified_cache_key(email))
        is_identity_verified_email = cache.get(get_identity_verified_cache_key(email))
        if not is_verified_email or not is_identity_verified_email:
            return Response(
                {"error": "이메일 인증 및 본인인증이 완료되지 않았습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)

            cache.delete(get_email_verified_cache_key(email))
            cache.delete(get_identity_verified_cache_key(email))

            return Response({
                "message": "회원가입이 완료되었습니다.",
                "token": str(refresh.access_token),
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 프로필 등록
class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                "message": "프로필 등록이 완료되었습니다.",
                "profile": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)