import { authFetch } from "./api";

export type ProfileRecord = {
  id: number;
  nickname: string;
  created_at: string;
};

export async function createProfile(
  nickname: string,
): Promise<{ message: string; profile: ProfileRecord }> {
  return authFetch("/api/v1/profiles/", {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
}

export async function updateProfile(
  profileId: number,
  nickname: string,
): Promise<{ message: string; profile: ProfileRecord }> {
  return authFetch(`/api/v1/profiles/${profileId}/`, {
    method: "PATCH",
    body: JSON.stringify({ nickname }),
  });
}
