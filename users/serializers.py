from django.contrib.auth import get_user_model
from rest_framework import serializers

from users.models import Profile

User = get_user_model()


class SignUpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        # password 유효성 검사
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': '비밀번호가 일치하지 않습니다.'})

        # todo: db의 이메일 인증, 본인 인증 여부 체크
        return data

    def create(self, validated_data):
        # 유저 생성
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


# ModelSerializer로 필드 그대로 가져 오기
class ProfileSerializer(serializers.ModelSerializer):
    # ModelSerializer는 Meta 필수
    # Meta에 등록함으로써
    class Meta:
        model = Profile
        fields = ('id', 'nickname', 'created_at')
        read_only_fields = ('id', 'created_at')


# 유저 관련
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "is_subscribed", "is_adult_mode")
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
