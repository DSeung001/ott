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
    nickname = serializers.CharField(max_length=15, trim_whitespace=True)
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

# 유저 관련
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "is_subscribed")
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
