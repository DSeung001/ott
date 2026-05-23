from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


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


class User(AbstractUser):
    username = None

    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )
    is_subscribed = models.BooleanField(default=False)
    is_adult_mode = models.BooleanField(default=False)

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
    nickname = models.CharField(max_length=63)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}- {self.nickname}"
