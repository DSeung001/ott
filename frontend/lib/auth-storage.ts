const USER_STORAGE_KEY = "user";

export type StoredAuthUser = {
  profileUserId: number;
  token: string;
  selectedProfileId?: number;
  selectedProfileNickname?: string;
  selected_avatar_file?: string;
};

export type SelectedProfile = {
  id: number;
  nickname: string;
  avatar_file?: string;
};

export function saveAuth(tokenHex: string, userId: number): void {
  const payload: StoredAuthUser = {
    profileUserId: userId,
    token: tokenHex.startsWith("Token ") ? tokenHex : `Token ${tokenHex}`,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredUser(): StoredAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: StoredAuthUser): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthHeader(): string | null {
  return getStoredUser()?.token ?? null;
}

export function getProfileUserId(): number | null {
  return getStoredUser()?.profileUserId ?? null;
}

export function setSelectedProfile(
  id: number,
  nickname: string,
  avatar_file?: string,
): void {
  const user = getStoredUser();
  if (!user) return;
  persistUser({
    ...user,
    selectedProfileId: id,
    selectedProfileNickname: nickname,
    selected_avatar_file: avatar_file,
  });
}

export function getSelectedProfile(): SelectedProfile | null {
  const user = getStoredUser();
  if (user?.selectedProfileId == null || !user.selectedProfileNickname) {
    return null;
  }
  return {
    id: user.selectedProfileId,
    nickname: user.selectedProfileNickname,
    avatar_file: user.selected_avatar_file,
  };
}

export function clearSelectedProfile(): void {
  const user = getStoredUser();
  if (!user) return;
  const {
    selectedProfileId: _id,
    selectedProfileNickname: _nick,
    selected_avatar_file: _avatar,
    ...rest
  } = user;
  persistUser(rest);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("ott_token");
  localStorage.removeItem("ott_user");
}

export function isLoggedIn(): boolean {
  return !!getStoredUser()?.token;
}

export function hasSelectedProfile(): boolean {
  return getSelectedProfile() != null;
}
