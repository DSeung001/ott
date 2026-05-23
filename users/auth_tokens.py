from django.utils import timezone

from users.constants import AUTH_TOKEN_TTL_DAYS
from users.models import AuthToken


def create_session_token(user, *, ttl_days=AUTH_TOKEN_TTL_DAYS):
    # todo 다중 시청 관리 => 멤버쉽에 따른
    token = AuthToken.create_for_user(user, ttl_days=ttl_days)
    return token.key


def get_user_from_token(key: str):
    if not key:
        return None
    try:
        auth = AuthToken.objects.select_related('user').get(key=key)
    except AuthToken.DoesNotExist:
        return None
    if auth.expires_at and auth.expires_at < timezone.now():
        auth.delete()
        return None
    return auth.user


def remove_session_token(key: str):
    deleted, _ = AuthToken.objects.filter(key=key).delete()
    return deleted > 0
