import secrets
from datetime import timedelta

from django.utils import timezone

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from users.constants import AUTH_TOKEN_TTL_DAYS, DEFAULT_AVATAR_FILE


# https://docs.djangoproject.com/en/6.0/topics/auth/customizing/
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The given email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # python manage.py createsuperuser 함수
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Membership(models.Model):
    CODE_CHOICES = [
        ("basic", "베이직"),
        ("premium", "프리미엄"),
    ]

    code = models.SlugField(max_length=32, choices=CODE_CHOICES, unique=True, db_index=True)
    price = models.PositiveIntegerField()

    class Meta:
        ordering = ('price',)

    def __str__(self):
        return self.code


class User(AbstractUser):
    username = None
    first_name = None
    last_name = None

    membership = models.ForeignKey(
        Membership,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscribers',
    )

    name = models.CharField(max_length=32)
    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )
    USERNAME_FIELD = 'email'

    # email이 기본 포함
    REQUIRED_FIELDS = []
    # 매니저 연결, Django의 내부 로직은 objects를 통해 매니저를 찾도록 되어 있음
    # https://docs.djangoproject.com/en/6.0/topics/db/managers/
    objects = CustomUserManager()

    def __str__(self):
        return self.email


class Profile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='profiles')
    nickname = models.CharField(max_length=16)
    avatar_file = models.CharField(max_length=64, default=DEFAULT_AVATAR_FILE)
    is_adult_mode = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}- {self.nickname}"


class AuthToken(models.Model):
    key = models.CharField(max_length=40, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    @classmethod
    def create_for_user(cls, user, *, ttl_days=AUTH_TOKEN_TTL_DAYS):
        key = secrets.token_hex(20)  # 20바이트 = 40자리
        expires_at = timezone.now() + timedelta(days=ttl_days) if ttl_days else None
        return cls.objects.create(key=key, user=user, expires_at=expires_at)
