const AVATAR_COLORS = [
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#eab308",
];

export function getAvatarColor(nickname: string): string {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getAvatarInitial(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}
