import { authFetch } from "./api";

export type MembershipPlanRecord = {
  id: number;
  code: string;
  price: number;
};

export type SubscriptionRecord = {
  id: number;
  status: string;
  started_at: string;
  next_billing_at: string | null;
  end_at: string | null;
  ended_at: string | null;
  subscribed_days: number;
  membership: MembershipPlanRecord;
  pending_membership: MembershipPlanRecord | null;
};

export type MembershipPlansResponse = {
  plans: MembershipPlanRecord[];
};

export type SubscriptionStatusResponse = {
  is_subscribed: boolean;
  subscription: SubscriptionRecord | null;
};

export type SubscriptionActionResponse = {
  message: string;
  is_subscribed: boolean;
  subscription?: SubscriptionRecord;
};

/** 플랜 카탈로그 (Membership) */
export async function getMembershipPlans(): Promise<MembershipPlansResponse> {
  return authFetch("/api/v1/membership/");
}

/** 내 구독 상태 (Subscription) */
export async function getSubscription(): Promise<SubscriptionStatusResponse> {
  return authFetch("/api/v1/subscriptions/");
}

export async function getMembershipStatus(): Promise<
  MembershipPlansResponse & SubscriptionStatusResponse & { current: MembershipPlanRecord | null }
> {
  const [plans, subscription] = await Promise.all([
    getMembershipPlans(),
    getSubscription(),
  ]);
  return {
    ...plans,
    ...subscription,
    current: subscription.subscription?.membership ?? null,
  };
}

export async function subscribeMembership(
  membershipId: number,
): Promise<SubscriptionActionResponse> {
  return authFetch("/api/v1/subscriptions/", {
    method: "POST",
    body: JSON.stringify({ membership_id: membershipId }),
  });
}

export async function changeSubscriptionPlan(
  membershipId: number,
): Promise<SubscriptionActionResponse> {
  return authFetch("/api/v1/subscriptions/", {
    method: "PATCH",
    body: JSON.stringify({ membership_id: membershipId }),
  });
}

export async function cancelMembership(): Promise<SubscriptionActionResponse> {
  return authFetch("/api/v1/subscriptions/", {
    method: "DELETE",
  });
}
