export type CachedProfile = {
  id: number;
  nickname: string;
};

function storageKey(userId: number): string {
  return `ott_profiles_${userId}`;
}

export function getProfiles(userId: number): CachedProfile[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CachedProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setProfiles(userId: number, profiles: CachedProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(profiles));
}

export function addProfile(userId: number, profile: CachedProfile): void {
  const existing = getProfiles(userId);
  if (existing.some((p) => p.id === profile.id)) return;
  setProfiles(userId, [...existing, profile]);
}

export function updateProfileInCache(
  userId: number,
  profileId: number,
  nickname: string,
): void {
  const existing = getProfiles(userId);
  setProfiles(
    userId,
    existing.map((p) =>
      p.id === profileId ? { ...p, nickname } : p,
    ),
  );
}

export function getProfileById(
  userId: number,
  profileId: number,
): CachedProfile | null {
  return getProfiles(userId).find((p) => p.id === profileId) ?? null;
}
