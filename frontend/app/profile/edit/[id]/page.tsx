"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { AvatarPickerModal } from "@/components/profile/AvatarPickerModal";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ApiError } from "@/lib/api";
import {
  DEFAULT_AVATAR_FILE,
  isAvatarFile,
  type AvatarFile,
} from "@/lib/avatar-catalog";
import {
  getProfileUserId,
  getSelectedProfile,
  setSelectedProfile,
} from "@/lib/auth-storage";
import { PROFILE_NICKNAME_MAX_LENGTH } from "@/lib/profile-constants";
import { getProfile, updateProfile } from "@/lib/profile-api";
import {
  getProfileById,
  updateProfileInCache,
} from "@/lib/profile-storage";

function EditPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--auth-page-bg)] text-[var(--auth-muted)]">
      로딩 중...
    </div>
  );
}

function resolveAvatarFile(file: string | undefined): AvatarFile {
  if (file && isAvatarFile(file)) return file;
  return DEFAULT_AVATAR_FILE;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = Number(params.id);
  const ready = useRequireAuth();

  const [nickname, setNickname] = useState("");
  const [initialNickname, setInitialNickname] = useState("");
  const [avatarFile, setAvatarFile] = useState<AvatarFile>(DEFAULT_AVATAR_FILE);
  const [initialAvatarFile, setInitialAvatarFile] =
    useState<AvatarFile>(DEFAULT_AVATAR_FILE);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || Number.isNaN(profileId)) return;

    const userId = getProfileUserId();
    if (userId == null) {
      router.replace("/auth/login");
      return;
    }

    const cached = getProfileById(userId, profileId);
    if (!cached) {
      router.replace("/profile?edit=1");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { profile } = await getProfile(profileId);
        if (cancelled) return;
        const file = resolveAvatarFile(profile.avatar_file);
        setNickname(profile.nickname);
        setInitialNickname(profile.nickname);
        setAvatarFile(file);
        setInitialAvatarFile(file);
        updateProfileInCache(userId, profileId, {
          nickname: profile.nickname,
          avatar_file: profile.avatar_file,
        });
      } catch {
        if (cancelled) return;
        const file = resolveAvatarFile(cached.avatar_file);
        setNickname(cached.nickname);
        setInitialNickname(cached.nickname);
        setAvatarFile(file);
        setInitialAvatarFile(file);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, profileId, router]);

  const handleAvatarPick = (file: AvatarFile) => {
    setAvatarFile(file);
    setError(null);
  };

  const handleCancel = () => {
    router.push("/profile?edit=1");
  };

  const handleSave = async () => {
    const userId = getProfileUserId();
    if (userId == null || Number.isNaN(profileId)) return;

    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateProfile(profileId, {
        nickname: trimmed,
        avatar_file: avatarFile,
      });
      const { profile } = result;

      updateProfileInCache(userId, profileId, {
        nickname: profile.nickname,
        avatar_file: profile.avatar_file,
      });

      const selected = getSelectedProfile();
      if (selected?.id === profileId) {
        setSelectedProfile(
          profileId,
          profile.nickname,
          profile.avatar_file,
        );
      }

      router.push("/profile?edit=1");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "프로필 수정에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  const charCount = nickname.length;
  const trimmed = nickname.trim();
  const nicknameChanged = trimmed !== initialNickname.trim();
  const avatarChanged = avatarFile !== initialAvatarFile;
  const canSave =
    loaded &&
    trimmed.length > 0 &&
    trimmed.length <= PROFILE_NICKNAME_MAX_LENGTH &&
    (nicknameChanged || avatarChanged) &&
    !saving;

  if (!ready || Number.isNaN(profileId) || !loaded) {
    return <EditPageFallback />;
  }

  return (
    <ProfileLayout>
      <p className="text-sm font-medium text-[var(--auth-muted)]">
        프로필 편집
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
        프로필 정보를 수정해주세요.
      </h1>

      <div className="mx-auto mt-12 w-full max-w-md text-left">
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group relative block"
            aria-label="프로필 이미지 수정"
          >
            <span className="relative block overflow-hidden rounded-full shadow-sm ring-2 ring-transparent transition group-hover:ring-[var(--auth-primary)]">
              <ProfileAvatar
                nickname={trimmed || initialNickname}
                avatar_file={avatarFile}
                size="lg"
              />
              <span className="absolute inset-x-0 bottom-0 flex h-[20%] items-center justify-center bg-black/55 text-[15px] font-medium text-white">
                수정
              </span>
            </span>
          </button>
        </div>

        <div className="mt-10 border-b border-[var(--auth-border-strong)] pb-2">
          <div className="flex items-end gap-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                const next = e.target.value.slice(
                  0,
                  PROFILE_NICKNAME_MAX_LENGTH,
                );
                setNickname(next);
                setError(null);
              }}
              maxLength={PROFILE_NICKNAME_MAX_LENGTH}
              className="min-w-0 flex-1 bg-transparent text-lg text-[var(--foreground)] outline-none placeholder:text-[var(--auth-subtle)]"
              placeholder="닉네임"
              aria-label="닉네임"
              autoFocus
            />
            <span className="shrink-0 text-sm text-[var(--auth-muted)] tabular-nums">
              {charCount}/{PROFILE_NICKNAME_MAX_LENGTH}자
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert("연령 제한 설정은 준비 중입니다.")}
          className="mt-6 flex w-full items-center gap-4 border-b border-[var(--auth-border)] py-5 text-left transition hover:bg-white"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--foreground)]">
              콘텐츠 연령 제한
            </p>
            <p className="mt-1 text-sm text-[var(--auth-muted)]">
              19세 연령 콘텐츠까지 시청 가능
            </p>
          </div>
          <svg
            className="h-5 w-5 shrink-0 text-[var(--auth-subtle)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-12 flex justify-center gap-3">
          <AuthButton
            type="button"
            variant="secondary"
            className="!w-auto min-w-[88px] px-8"
            onClick={handleCancel}
            disabled={saving}
          >
            취소
          </AuthButton>
          <AuthButton
            type="button"
            variant="primary"
            className="!w-auto min-w-[88px] px-8"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? "저장 중..." : "저장"}
          </AuthButton>
        </div>
      </div>

      <AvatarPickerModal
        open={pickerOpen}
        selectedFile={avatarFile}
        onClose={() => setPickerOpen(false)}
        onSave={handleAvatarPick}
      />
    </ProfileLayout>
  );
}
