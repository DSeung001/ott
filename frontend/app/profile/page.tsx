"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { AddProfileButton } from "@/components/profile/AddProfileButton";
import { CreateProfileModal } from "@/components/profile/CreateProfileModal";
import { useRequireAuth } from "@/hooks/useAuthGuard";
import { ApiError } from "@/lib/api";
import {
  getProfileUserId,
  setSelectedProfile,
} from "@/lib/auth-storage";
import { DEFAULT_AVATAR_FILE } from "@/lib/avatar-catalog";
import { createProfile } from "@/lib/profile-api";
import {
  addProfile,
  getProfiles,
  type CachedProfile,
} from "@/lib/profile-storage";

function ProfilePageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--auth-page-bg)] text-[var(--auth-muted)]">
      로딩 중...
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";

  const ready = useRequireAuth();
  const [profiles, setProfiles] = useState<CachedProfile[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadProfiles = useCallback(() => {
    const userId = getProfileUserId();
    if (userId == null) return;
    setProfiles(getProfiles(userId));
  }, []);

  useEffect(() => {
    if (ready) loadProfiles();
  }, [ready, loadProfiles]);

  const handleSelect = (profile: CachedProfile) => {
    setSelectedProfile(profile.id, profile.nickname, profile.avatar_file);
    router.push("/");
  };

  const handleCreate = async (nickname: string) => {
    const userId = getProfileUserId();
    if (userId == null) return;

    setCreating(true);
    setCreateError(null);
    try {
      const result = await createProfile(nickname, DEFAULT_AVATAR_FILE);
      const cached: CachedProfile = {
        id: result.profile.id,
        nickname: result.profile.nickname,
        avatar_file: result.profile.avatar_file,
        is_adult_mode: result.profile.is_adult_mode,
      };
      addProfile(userId, cached);
      loadProfiles();
      setModalOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "프로필 생성에 실패했습니다.",
      );
    } finally {
      setCreating(false);
    }
  };

  const enterEditMode = () => {
    router.push("/profile?edit=1");
  };

  const exitEditMode = () => {
    router.push("/profile");
  };

  if (!ready) {
    return <ProfilePageFallback />;
  }

  return (
    <ProfileLayout>
      <p className="text-sm font-medium text-[var(--auth-muted)]">
        {isEditMode ? "프로필 편집" : "프로필 선택"}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
        {isEditMode
          ? "수정할 프로필을 선택해주세요."
          : "사용할 프로필을 선택해주세요."}
      </h1>

      <div className="mt-12 flex flex-wrap items-start justify-center gap-8">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            mode={isEditMode ? "edit" : "select"}
            onSelect={() => handleSelect(profile)}
            onEdit={() => router.push(`/profile/edit/${profile.id}`)}
          />
        ))}
        {!isEditMode && (
          <AddProfileButton onClick={() => setModalOpen(true)} />
        )}
      </div>

      {isEditMode ? (
        <button
          type="button"
          onClick={exitEditMode}
          className="mt-16 rounded-lg border border-[var(--auth-border-strong)] px-8 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
        >
          완료
        </button>
      ) : (
        <button
          type="button"
          onClick={enterEditMode}
          disabled={profiles.length === 0}
          className="mt-16 rounded-lg border border-[var(--auth-border-strong)] px-8 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          프로필 편집
        </button>
      )}

      <CreateProfileModal
        open={modalOpen}
        loading={creating}
        error={createError}
        onClose={() => {
          setModalOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreate}
      />
    </ProfileLayout>
  );
}
