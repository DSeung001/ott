import {
  MEMBERSHIP_PLANS,
  type MembershipPlan,
  type MembershipPlanId,
} from "@/lib/membership-plans";
import type { MembershipPlanRecord } from "@/lib/membership-api";

export type DisplayMembershipPlan = MembershipPlan & {
  apiId: number;
  monthlyPrice: number;
  isCurrent?: boolean;
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

export function enrichMembershipPlans(
  apiPlans: MembershipPlanRecord[],
  current: MembershipPlanRecord | null,
): DisplayMembershipPlan[] {
  return apiPlans.map((apiPlan) => {
    const local = MEMBERSHIP_PLANS.find((p) => p.id === apiPlan.code);
    const currentId = current?.id ?? null;

    return {
      apiId: apiPlan.id,
      id: (apiPlan.code as MembershipPlanId) ?? "basic",
      name: local?.name ?? getMembershipDisplayName(apiPlan.code),
      description: local?.description ?? "",
      monthlyPrice: apiPlan.price,
      recommended: local?.recommended,
      features: local?.features ?? [],
      isCurrent: currentId === apiPlan.id,
    };
  });
}

/** 결제 예정일 UI용 (백엔드 미제공 시 클라이언트 목업) */
export function getMockNextBillingDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 플랜 카드용: "6월 8일 결제 예정" */
export function getNextBillingLabel(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 결제 예정`;
}
