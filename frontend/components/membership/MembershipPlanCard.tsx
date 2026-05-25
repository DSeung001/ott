"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";
import { getNextBillingLabel } from "@/lib/membership-display";
import { formatKrw } from "@/lib/membership-plans";
import type { DisplayMembershipPlan } from "@/lib/membership-display";

type MembershipPlanCardProps = {
  plan: DisplayMembershipPlan;
  subscribing?: boolean;
  onSubscribe: (membershipId: number) => void;
};

/** 카드 하단 액션 영역 높이 통일 */
const ACTION_BLOCK_CLASS =
  "mt-8 flex min-h-[7.25rem] flex-col items-center justify-end";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--auth-primary)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MembershipPlanCard({
  plan,
  subscribing = false,
  onSubscribe,
}: MembershipPlanCardProps) {
  const isRecommended = plan.recommended && !plan.isCurrent;

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm ${
        plan.isCurrent
          ? "border-[var(--auth-primary)] ring-2 ring-[var(--auth-primary)]/20"
          : isRecommended
            ? "border-[var(--auth-primary)] ring-2 ring-[var(--auth-primary)]/20"
            : "border-[var(--auth-border)]"
      }`}
    >
      {plan.isCurrent && (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--auth-primary)] px-3 py-1 text-xs font-semibold text-white">
          이용 중
        </span>
      )}
      {!plan.isCurrent && isRecommended && (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--auth-primary)] px-3 py-1 text-xs font-semibold text-white">
          추천
        </span>
      )}

      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {plan.name}
        </h2>
        <p className="mt-2 text-sm text-[var(--auth-muted)]">
          {plan.description}
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {formatKrw(plan.monthlyPrice)}
        </p>
        <p className="mt-1 text-sm text-[var(--auth-subtle)]">/월</p>
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <CheckIcon />
            <span className="text-[var(--foreground)]">{feature}</span>
          </li>
        ))}
      </ul>

      <div className={ACTION_BLOCK_CLASS}>
        {plan.isCurrent ? (
          <>
            <p className="text-center text-sm font-medium text-[var(--auth-muted)]">
              {getNextBillingLabel()}
            </p>
            <Link
              href="/membership/manage"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--auth-border-strong)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--auth-page-bg)]"
            >
              내 멤버십 관리
            </Link>
          </>
        ) : (
          <AuthButton
            type="button"
            variant={isRecommended ? "primary" : "secondary"}
            className="w-full"
            disabled={subscribing}
            onClick={() => onSubscribe(plan.apiId)}
          >
            {subscribing ? "처리 중..." : `${plan.name} 시작하기`}
          </AuthButton>
        )}
      </div>
    </article>
  );
}
