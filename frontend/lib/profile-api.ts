import { authFetch } from "./api";

export type ProfileRecord = {
  id: number;
  nickname: string;
  avatar_file: string;
  created_at: string;
  is_adult_mode: boolean;
};

export type UpdateProfilePayload = {
  nickname?: string;
  avatar_file?: string;
};

export async function getProfile(
  profileId: number,
): Promise<{ profile: ProfileRecord }> {
  return authFetch(`/api/v1/profiles/${profileId}/`);
}

export async function createProfile(
  nickname: string,
  avatar_file?: string,
): Promise<{ message: string; profile: ProfileRecord }> {
  return authFetch("/api/v1/profiles/", {
    method: "POST",
    body: JSON.stringify({ nickname, avatar_file }),
  });
}

export async function updateProfile(
  profileId: number,
  payload: UpdateProfilePayload,
): Promise<{ message: string; profile: ProfileRecord }> {
  return authFetch(`/api/v1/profiles/${profileId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
