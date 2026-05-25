export type MembershipPlanId = "basic" | "premium";

export type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  recommended?: boolean;
  features: string[];
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "basic",
    name: "베이직",
    description: "혼자 보기 좋은 합리적인 플랜",
    monthlyPrice: 9900,
    features: [
      "프로필 1인 · 동시재생 1회선",
      "최신화 시청",
      "다운로드 지원",
      "FHD 화질 지원",
      "TV 앱 지원",
      "실시간 라이브 감상",
    ],
  },
  {
    id: "premium",
    name: "프리미엄",
    description: "가족·친구와 함께 나눠 쓰기 좋은 플랜",
    monthlyPrice: 14900,
    recommended: true,
    features: [
      "프로필 4인 · 동시재생 4회선",
      "최신화 시청",
      "다운로드 지원",
      "FHD 화질 지원",
      "TV 앱 지원",
      "실시간 라이브 감상",
    ],
  },
];

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
