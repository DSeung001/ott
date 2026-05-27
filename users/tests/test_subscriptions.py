from django.urls import reverse
from rest_framework import status

from users.constants import MembershipCode, SubscriptionStatus, PaymentStatus
from users.models import Membership, Subscription, Payment
from users.tests.utils import SignupFlowMixin


class SubscriptionLifecycleTests(SignupFlowMixin):
    def _subscribe_basic(self) -> Subscription:
        self.signup_and_auth()

        basic = Membership.objects.get(code=MembershipCode.BASIC)
        resp = self.client.post(
            reverse("users:subscriptions"),
            {"membership_id": basic.id},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        return Subscription.objects.get(user__email="newuser@example.com", status=SubscriptionStatus.ACTIVE)

    def test_cancel_subscription_sets_ended_fields(self):
        sub = self._subscribe_basic()

        # 취소(해지)
        resp = self.client.delete(
            reverse("users:subscriptions"),
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertFalse(resp.data["is_subscribed"])

        sub.refresh_from_db()
        self.assertEqual(sub.status, SubscriptionStatus.ENDED)
        self.assertIsNotNone(sub.ended_at)
        self.assertIsNone(sub.next_billing_at)
        self.assertIsNone(sub.pending_membership_id)
        self.assertIsNone(sub.end_at)

        # 해지 상황 재현, 환불과 다름
        pay = Payment.objects.get(subscription=sub)
        self.assertEqual(pay.status, PaymentStatus.PAID)
        self.assertIsNone(pay.refund_at)

    def test_change_plan_sets_pending_membership_only(self):
        self.signup_and_auth()

        basic = Membership.objects.get(code=MembershipCode.BASIC)
        premium = Membership.objects.get(code=MembershipCode.PREMIUM)

        # basic 구독
        create = self.client.post(
            reverse("users:subscriptions"),
            {"membership_id": basic.id},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED, create.data)

        sub = Subscription.objects.get(user__email="newuser@example.com", status=SubscriptionStatus.ACTIVE)
        self.assertEqual(sub.membership_id, basic.id)
        self.assertIsNone(sub.pending_membership_id)

        # 플랜 변경 예약, pending_membership만 변경
        change = self.client.patch(
            reverse("users:subscriptions"),
            {"membership_id": premium.id},
            format="json",
        )
        self.assertEqual(change.status_code, status.HTTP_200_OK, change.data)
        self.assertTrue(change.data["is_subscribed"])

        sub.refresh_from_db()
        self.assertEqual(sub.membership_id, basic.id)
        self.assertEqual(sub.pending_membership_id, premium.id)

    def test_change_plan_to_same_plan_returns_400(self):
        self.signup_and_auth()

        basic = Membership.objects.get(code=MembershipCode.BASIC)

        create = self.client.post(
            reverse("users:subscriptions"),
            {"membership_id": basic.id},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED, create.data)

        # 같은 플랜으로 변경 시도는 에러
        change = self.client.patch(
            reverse("users:subscriptions"),
            {"membership_id": basic.id},
            format="json",
        )
        self.assertEqual(change.status_code, status.HTTP_400_BAD_REQUEST, change.data)