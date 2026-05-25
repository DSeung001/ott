"""구독(Subscription) 조회 헬퍼. 모델 users.models.Subscription 과 구분."""

from users.constants import SubscriptionStatus


def get_current_subscription(user):
    return (
        user.subscriptions
        .filter(status__in=[
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.CANCEL_SCHEDULED,
        ])
        .select_related("membership", "pending_membership")
        .order_by("-started_at")
        .first()
    )