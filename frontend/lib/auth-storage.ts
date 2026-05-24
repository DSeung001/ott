const USER_STORAGE_KEY = "user";

export type StoredAuthUser = {
  profileUserId: number;
  token: string; // "Token xxxx..."
};

export function saveAuth(tokenHex: string, userId: number): void {
  const payload: StoredAuthUser = {
    profileUserId: userId,
    token: tokenHex.startsWith("Token ") ? tokenHex : `Token ${tokenHex}`,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredUser(): StoredAuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function getAuthHeader(): string | null {
  return getStoredUser()?.token ?? null;
}

export function getProfileUserId(): number | null {
  return getStoredUser()?.profileUserId ?? null;
}

export function clearAuth(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
  // 선택: 예전 키 정리
  localStorage.removeItem("ott_token");
  localStorage.removeItem("ott_user");
}

export function isLoggedIn(): boolean {
  return !!getStoredUser()?.token;
}