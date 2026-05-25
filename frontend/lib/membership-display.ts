import {
  MEMBERSHIP_PLANS,
  type MembershipPlan,
  type MembershipPlanId,
} from "@/lib/membership-plans";
import type {
  MembershipPlanRecord,
  SubscriptionRecord,
} from "@/lib/membership-api";

export type DisplayMembershipPlan = MembershipPlan & {
  apiId: number;
  monthlyPrice: number;
  isCurrent?: boolean;
  isPending?: boolean;
};

const CODE_LABEL: Record<string, string> = {
  basic: "베이직",
  premium: "프리미엄",
};

export function getMembershipDisplayName(
  code: string,
  fallback?: string,
): string {
  return CODE_LABEL[code] ?? fallback ?? code;
}

function parseBillingDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** manage 페이지: YYYY.MM.DD */
export function formatBillingDateDot(iso: string | null | undefined): string {
  const date = parseBillingDate(iso);
  if (!date) return "—";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 플랜 카드용: "6월 8일 결제 예정" */
export function formatNextBillingLabel(
  iso: string | null | undefined,
): string {
  const date = parseBillingDate(iso);
  if (!date) return "결제 예정일 없음";
  return `${date.getMonth() + 1}월 ${date.getDate()}일 결제 예정`;
}

export function enrichMembershipPlans(
  apiPlans: MembershipPlanRecord[],
  subscription: SubscriptionRecord | null,
): DisplayMembershipPlan[] {
  const currentId = subscription?.membership.id ?? null;
  const pendingId = subscription?.pending_membership?.id ?? null;

  return apiPlans.map((apiPlan) => {
    const local = MEMBERSHIP_PLANS.find((p) => p.id === apiPlan.code);

    return {
      apiId: apiPlan.id,
      id: (apiPlan.code as MembershipPlanId) ?? "basic",
      name: local?.name ?? getMembershipDisplayName(apiPlan.code),
      description: local?.description ?? "",
      monthlyPrice: apiPlan.price,
      recommended: local?.recommended,
      features: local?.features ?? [],
      isCurrent: currentId === apiPlan.id,
      isPending: pendingId === apiPlan.id,
    };
  });
}
