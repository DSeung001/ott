"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { MembershipPlanCard } from "@/components/membership/MembershipPlanCard";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ApiError } from "@/lib/api";
import {
  changeSubscriptionPlan,
  getMembershipStatus,
  subscribeMembership,
  type SubscriptionRecord,
} from "@/lib/membership-api";
import {
  enrichMembershipPlans,
  formatNextBillingLabel,
  type DisplayMembershipPlan,
} from "@/lib/membership-display";

export default function MembershipSubscribedPage() {
  const ready = useRequireAuth();
  const [plans, setPlans] = useState<DisplayMembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(
    null,
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const data = await getMembershipStatus();
      setSubscription(data.subscription);
      setIsSubscribed(data.is_subscribed);
      setPlans(enrichMembershipPlans(data.plans, data.subscription));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "멤버십 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const handlePlanAction = async (membershipId: number) => {
    setActingId(membershipId);
    setError(null);
    setSuccessMessage(null);
    try {
      if (isSubscribed) {
        const res = await changeSubscriptionPlan(membershipId);
        setSuccessMessage(res.message);
      } else {
        await subscribeMembership(membershipId);
        setSuccessMessage("멤버십이 적용되었습니다.");
      }
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "요청을 처리하지 못했습니다.",
      );
    } finally {
      setActingId(null);
    }
  };

  const nextBillingLabel = subscription
    ? formatNextBillingLabel(subscription.next_billing_at)
    : undefined;

  if (!ready || loading) {
    return <PageLoading />;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <AppHeader showProfileMenu />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start px-4 pb-4 pt-[42px] sm:px-6 sm:pt-[50px]">
        {isSubscribed && subscription && (
          <p className="shrink-0 text-center text-base font-semibold text-[var(--foreground)]">
            구독{" "}
            <span className="font-bold text-[var(--auth-primary)]">
              {subscription.subscribed_days}일째
            </span>
            <span className="font-normal text-[var(--auth-muted)]">
              {" "}
              · {nextBillingLabel}
            </span>
          </p>
        )}

        {successMessage && (
          <p
            className="mt-3 shrink-0 text-center text-sm text-[var(--auth-primary)]"
            role="status"
          >
            {successMessage}
          </p>
        )}

        {error && (
          <p className="mt-3 shrink-0 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <section
          className={`grid shrink-0 items-stretch gap-4 sm:grid-cols-2 ${
            isSubscribed && subscription ? "mt-4" : "mt-0"
          }`}
        >
          {plans.map((plan) => (
            <MembershipPlanCard
              key={plan.apiId}
              plan={plan}
              dense
              isSubscribed={isSubscribed}
              subscribing={actingId === plan.apiId}
              nextBillingLabel={nextBillingLabel}
              onPlanAction={handlePlanAction}
            />
          ))}
        </section>

        {plans.length === 0 && !error && (
          <p className="mt-6 shrink-0 text-center text-sm text-[var(--auth-muted)]">
            등록된 멤버십 플랜이 없습니다. 관리자에게 문의해 주세요.
          </p>
        )}

        <p className="mt-4 shrink-0 text-center text-xs leading-snug text-[var(--auth-subtle)]">
          구독 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
          멤버십 해지 시 이용 권한이 즉시 종료될 수 있습니다.
        </p>
      </main>
    </div>
  );
}
