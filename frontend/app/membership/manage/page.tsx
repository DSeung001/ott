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
  type MembershipPlanRecord,
} from "@/lib/membership-api";
import {
  getMembershipDisplayName,
  getMockNextBillingDate,
} from "@/lib/membership-display";
import { formatKrw } from "@/lib/membership-plans";

function ManageRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--auth-border)] py-6 last:border-b-0">
      <p className="text-sm text-[var(--auth-muted)]">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function MembershipManagePage() {
  const router = useRouter();
  const ready = useRequireAuth();
  const [current, setCurrent] = useState<MembershipPlanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMembershipStatus();
      if (!data.is_subscribed || !data.current) {
        router.replace("/membership/subscribed");
        return;
      }
      setCurrent(data.current);
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
    if (!confirm("멤버십을 해지하시겠습니까?")) return;

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

  if (!current) {
    return <PageLoading />;
  }

  const planName = getMembershipDisplayName(current.code);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <AppHeader showProfileMenu />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">내 멤버십 관리</h1>

        <div className="mt-8 rounded-2xl border border-[var(--auth-border)] bg-white px-6 shadow-sm">
          <ManageRow label="결제 예정 멤버십">
            <p className="text-lg font-bold text-[var(--auth-primary)]">
              {planName}
            </p>
          </ManageRow>

          <ManageRow label="결제 수단">
            <p className="text-sm text-[var(--auth-subtle)]">
              등록된 결제 수단이 없습니다.
            </p>
          </ManageRow>

          <ManageRow label="결제 예정일">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {getMockNextBillingDate()}
            </p>
          </ManageRow>

          <ManageRow label="결제 예정 금액">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {formatKrw(current.price)}
            </p>
          </ManageRow>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-10 flex justify-center">
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
      </main>
    </div>
  );
}
