"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { MembershipPlanCard } from "@/components/membership/MembershipPlanCard";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ApiError } from "@/lib/api";
import {
  getMembershipStatus,
  subscribeMembership,
} from "@/lib/membership-api";
import {
  enrichMembershipPlans,
  type DisplayMembershipPlan,
} from "@/lib/membership-display";

export default function MembershipSubscribedPage() {
  const ready = useRequireAuth();
  const [plans, setPlans] = useState<DisplayMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembershipStatus();
      setPlans(enrichMembershipPlans(data.plans, data.current));
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

  const handleSubscribe = async (membershipId: number) => {
    setSubscribingId(membershipId);
    setError(null);
    try {
      await subscribeMembership(membershipId);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "멤버십 구독에 실패했습니다.",
      );
    } finally {
      setSubscribingId(null);
    }
  };

  if (!ready || loading) {
    return <PageLoading />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <AppHeader showProfileMenu />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">

        {error && (
          <p className="mt-6 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <section className="mt-12 grid items-stretch gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <MembershipPlanCard
              key={plan.apiId}
              plan={plan}
              subscribing={subscribingId === plan.apiId}
              onSubscribe={handleSubscribe}
            />
          ))}
        </section>

        {plans.length === 0 && !error && (
          <p className="mt-12 text-center text-sm text-[var(--auth-muted)]">
            등록된 멤버십 플랜이 없습니다. 관리자에게 문의해 주세요.
          </p>
        )}

        <p className="mt-10 text-center text-xs leading-relaxed text-[var(--auth-subtle)]">
          구독 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.
          <br />
          멤버십은 언제든 해지할 수 있으며, 해지 후에도 결제 주기 종료일까지
          이용 가능합니다.
        </p>
      </main>
    </div>
  );
}
