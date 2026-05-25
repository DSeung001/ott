import { authFetch } from "./api";

export type MembershipPlanRecord = {
  id: number;
  code: string;
  price: number;
};

export type MembershipStatusResponse = {
  plans: MembershipPlanRecord[];
  current: MembershipPlanRecord | null;
  is_subscribed: boolean;
};

export type SubscribeMembershipResponse = {
  message: string;
  membership: MembershipPlanRecord;
  is_subscribed: boolean;
};

export type CancelMembershipResponse = {
  message: string;
  is_subscribed: boolean;
};

export async function getMembershipStatus(): Promise<MembershipStatusResponse> {
  return authFetch("/api/v1/membership/");
}

export async function subscribeMembership(
  membershipId: number,
): Promise<SubscribeMembershipResponse> {
  return authFetch("/api/v1/membership/", {
    method: "POST",
    body: JSON.stringify({ membership_id: membershipId }),
  });
}

export async function cancelMembership(): Promise<CancelMembershipResponse> {
  return authFetch("/api/v1/membership/", {
    method: "DELETE",
  });
}
