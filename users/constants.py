from django.db import models

CACHE_PREFIX = "ott:users"
AUTH_CODE_TIMEOUT = 300
EMAIL_VERIFIED_TIMEOUT = 600
IDENTITY_VERIFIED_TIMEOUT = 600
AUTH_TOKEN_TTL_DAYS = 7

DEFAULT_AVATAR_FILE = "48363a65-24d6-45a0-9eac-8c1726656c63.webp"


# 네이밍: Subscription(명사)=모델/API 리소스, subscribe(동사)=is_subscribed·프론트 함수명


class SubscriptionStatus(models.TextChoices):
    ACTIVE = "active", "이용 중"
    CANCEL_SCHEDULED = "cancel_scheduled", "해지 예약"
    ENDED = "ended", "종료"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "대기"
    PAID = "paid", "결제 완료"
    FAILED = "failed", "실패"
    REFUNDED = "refunded", "환불"


class MembershipCode(models.TextChoices):
    BASIC = "basic", "베이직"
    PREMIUM = "premium", "프리미엄"


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def get_auth_code_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:auth_code:{_normalize_email(email)}"


def get_email_verified_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:email_verified:{_normalize_email(email)}"


def get_identity_verified_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:identity_verified:{_normalize_email(email)}"
