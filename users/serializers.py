from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import serializers

from users.constants import SubscriptionStatus, PaymentStatus
from users.models import Profile, Membership, Subscription, Payment

User = get_user_model()


class SignUpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        # password 유효성 검사
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': '비밀번호가 일치하지 않습니다.'})
        if User.objects.filter(email__iexact=data['email']).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return data

    def create(self, validated_data):
        name = self.context.get('identity_name', '')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=name,
        )
        return user


# ModelSerializer로 필드 그대로 가져 오기
class ProfileSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(max_length=16, trim_whitespace=True)
    avatar_file = serializers.CharField(max_length=40)

    class Meta:
        model = Profile
        fields = ('id', 'nickname', 'avatar_file', 'created_at', 'is_adult_mode')
        read_only_fields = ('id', 'created_at')

    def validate_nickname(self, value):
        if not value:
            raise serializers.ValidationError("닉네임을 입력해주세요.")
        return value

    def validate_avatar_file(self, value):
        file = value.strip()
        valid_extensions = ('.png', '.webp', '.jpg', '.jpeg')

        if not file.lower().endswith(valid_extensions):
            raise serializers.ValidationError("지원하지 않는 이미지 형식입니다. (png, webp, jpg, jpeg만 가능)")
        return value


# 멤버쉽 목록용
class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ("id", "code", "price")
        read_only_fields = fields


# 유저 관련
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name")
        read_only_fields = fields


# 로그인
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(
            request=self.context.get('request'),
            email=data.get('email'),
            password=data.get('password')
        )
        if not user:
            raise serializers.ValidationError("이메일 또는 비밀번호가 올바르지 않습니다.")
        data["user"] = user
        return data


# 구독 (엔티티 응답)
class SubscriptionSerializer(serializers.ModelSerializer):
    membership = MembershipSerializer(read_only=True)
    pending_membership = MembershipSerializer(read_only=True)
    subscribed_days = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = (
            "id",
            "status",
            "started_at",
            "next_billing_at",
            "end_at",
            "ended_at",
            "membership",
            "pending_membership",
            "subscribed_days",
        )
        read_only_fields = fields

    def get_subscribed_days(self, obj):
        if not obj.started_at:
            return 0
        delta = timezone.now() - obj.started_at
        return max(delta.days + 1, 1)


# 구독 시작 (POST)
class SubscriptionCreateSerializer(serializers.Serializer):
    membership_id = serializers.PrimaryKeyRelatedField(
        queryset=Membership.objects.all(),
    )

    def validate(self, attrs):
        user = self.context.get("request").user
        active = (
            user.subscriptions.filter(
                status__in=[
                    SubscriptionStatus.ACTIVE,
                    SubscriptionStatus.CANCEL_SCHEDULED,
                ]
            ).exists()
        )

        if active:
            raise serializers.ValidationError(
                "이미 구독 중입니다."
            )
        return attrs

    def create(self, validated_data):
        from datetime import timedelta

        user = self.context["request"].user
        membership = validated_data["membership_id"]
        now = timezone.now()

        subscription = Subscription.objects.create(
            user=user,
            membership=membership,
            status=SubscriptionStatus.ACTIVE,
            started_at=now,
            next_billing_at=now + timedelta(days=30),
        )
        # todo: 스케줄링으로 결제되고 기록 쌓이게 해야함
        Payment.objects.create(
            user=user,
            subscription=subscription,
            amount=membership.price,
            status=PaymentStatus.PAID,
            paid_at=now,
        )
        return subscription

# 플랜 변경 예약 (PATCH, 다음 결제일부터)
class SubscriptionPlanChangeSerializer(serializers.Serializer):
    membership_id = serializers.PrimaryKeyRelatedField(
        queryset=Membership.objects.all(),
    )

    def validate(self, attrs):
        user = self.context.get("request").user
        new_membership = attrs["membership_id"]
        sub = self.instance
        if not sub:
            raise serializers.ValidationError("활성 구독이 없습니다.")
        if sub.membership_id == new_membership.id:
            raise serializers.ValidationError("이미 이용 중인 플랜입니다.")
        attrs["new_membership"] = new_membership
        return attrs

    def update(self, instance, validated_data):
        instance.pending_membership = validated_data["new_membership"]
        instance.save(update_fields=["pending_membership"])
        return instance


