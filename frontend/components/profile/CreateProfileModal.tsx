"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { PROFILE_NICKNAME_MAX_LENGTH } from "@/lib/profile-constants";

type CreateProfileModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
};

export function CreateProfileModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: CreateProfileModalProps) {
  const [nickname, setNickname] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-profile-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--auth-border)] bg-white p-6 shadow-lg">
        <h2
          id="create-profile-title"
          className="mb-6 text-lg font-bold text-[var(--foreground)]"
        >
          새 프로필 만들기
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="프로필 이름"
            maxLength={PROFILE_NICKNAME_MAX_LENGTH}
            required
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <AuthButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </AuthButton>
            <AuthButton type="submit" disabled={loading || !nickname.trim()}>
              {loading ? "만드는 중..." : "만들기"}
            </AuthButton>
          </div>
        </form>
      </div>
    </div>
  );
}
