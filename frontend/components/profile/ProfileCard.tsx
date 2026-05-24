"use client";

import { getAvatarColor, getAvatarInitial } from "@/lib/profile-avatar";
import type { CachedProfile } from "@/lib/profile-storage";

type ProfileCardProps = {
  profile: CachedProfile;
  mode?: "select" | "edit";
  onSelect?: () => void;
  onEdit?: () => void;
};

export function ProfileCard({
  profile,
  mode = "select",
  onSelect,
  onEdit,
}: ProfileCardProps) {
  const bg = getAvatarColor(profile.nickname);
  const initial = getAvatarInitial(profile.nickname);
  const isEdit = mode === "edit";

  return (
    <button
      type="button"
      onClick={isEdit ? onEdit : onSelect}
      className="group flex w-28 flex-col items-center gap-3 transition hover:opacity-90"
      aria-label={isEdit ? `${profile.nickname} 수정` : `${profile.nickname} 선택`}
    >
      <span className="relative">
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white shadow-sm ring-2 ring-transparent transition group-hover:ring-[var(--auth-primary)]"
          style={{ backgroundColor: bg }}
        >
          {initial}
        </span>
        {isEdit && (
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--foreground)] text-white shadow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-sm font-medium text-[var(--foreground)]">
        {profile.nickname}
      </span>
    </button>
  );
}
