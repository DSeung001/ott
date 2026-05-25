"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLoading } from "@/components/layout/PageLoading";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ApiError } from "@/lib/api";
import {
  cancelMembership,
  getMembershipStatus,
  type SubscriptionRecord,
} from "@/lib/membership-api";
import {
  formatBillingDateDot,
  getMembershipDisplayName,
} from "@/lib/membership-display";
import { formatKrw } from "@/lib/membership-plans";

function ManageRow({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`border-b border-[var(--auth-border)] last:border-b-0 ${
        compact ? "py-3.5" : "py-4"
      }`}
    >
      <p className="text-sm text-[var(--auth-muted)]">{label}</p>
      <div className={compact ? "mt-1.5" : "mt-2"}>{children}</div>
    </div>
  );
}

export default function MembershipManagePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMembershipStatus();
      if (!data.is_subscribed || !data.subscription) {
        router.replace("/membership/subscribed");
        return;
      }
      setSubscription(data.subscription);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "멤버십 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoaded(true);
    }
  }, [router]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const handleCancel = async () => {
    if (!confirm("멤버십을 해지하시겠습니까? 해지 후 이용 권한이 종료됩니다."))
      return;

    setCancelling(true);
    setError(null);
    try {
      await cancelMembership();
      router.push("/membership/subscribed");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "멤버십 해지에 실패했습니다.",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (!ready || !loaded) {
    return <PageLoading />;
  }

  if (!subscription) {
    return <PageLoading />;
  }

  const billingMembership =
    subscription.pending_membership ?? subscription.membership;
  const planName = getMembershipDisplayName(billingMembership.code);
  const currentPlanName = getMembershipDisplayName(
    subscription.membership.code,
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <AppHeader showProfileMenu />

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-start px-4 pb-6 pt-[58px] sm:px-6 sm:pt-[50px]">
        <div className="flex w-full flex-col items-center">
          <h1 className="shrink-0 text-center text-2xl font-bold">
            내 멤버십 관리
          </h1>

          <div className="mt-5 w-full shrink-0 rounded-2xl border border-[var(--auth-border)] bg-white px-5 shadow-sm">
          <ManageRow label="이용 중 멤버십" compact>
            <p className="text-base font-bold leading-snug text-[var(--auth-primary)]">
              {currentPlanName}
              <span className="ml-1.5 text-sm font-semibold text-[var(--foreground)]">
                · {formatKrw(subscription.membership.price)}/월
              </span>
            </p>
            <p className="text-xs leading-snug text-[var(--auth-muted)]">
              구독 {subscription.subscribed_days}일째
            </p>
          </ManageRow>

          <ManageRow label="다음 결제 예정 멤버십" compact>
            <p className="text-base font-bold leading-snug text-[var(--auth-primary)]">
              {planName}
              <span className="ml-1.5 text-sm font-semibold text-[var(--foreground)]">
                · {formatKrw(billingMembership.price)}/월
              </span>
            </p>
            {subscription.pending_membership && (
              <p className="text-xs leading-snug text-amber-700">
                다음 결제일부터 적용됩니다
              </p>
            )}
          </ManageRow>

          <ManageRow label="결제 수단" compact>
            <p className="text-sm leading-snug text-[var(--auth-subtle)]">
              등록된 결제 수단이 없습니다.
            </p>
          </ManageRow>

          <ManageRow label="다음 결제 예정일" compact>
            <p className="text-base font-bold leading-snug text-[var(--foreground)]">
              {formatBillingDateDot(subscription.next_billing_at)}
            </p>
          </ManageRow>

          <ManageRow label="결제 예정 금액" compact>
            <p className="text-base font-bold leading-snug text-[var(--foreground)]">
              {formatKrw(billingMembership.price)}
            </p>
          </ManageRow>
          </div>

          {error && (
            <p
              className="mt-3 w-full shrink-0 text-center text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex w-full shrink-0 justify-center">
            <AuthButton
              type="button"
              variant="secondary"
              className="!w-auto min-w-[160px] px-8"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "해지 중..." : "멤버십 해지"}
            </AuthButton>
          </div>
        </div>
      </main>
    </div>
  );
}
