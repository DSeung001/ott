"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useHomeAuthState } from "@/hooks/useAuthGuard";
import { getSelectedProfile } from "@/lib/auth-storage";
import { AuthButton } from "@/components/auth/AuthButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLoading } from "@/components/layout/PageLoading";

export default function HomePage() {
  const router = useRouter();
  const state = useHomeAuthState();
  const selectedProfile = getSelectedProfile();

  if (state === "loading" || state === "needsProfile") {
    return <PageLoading />;
  }

  if (state === "guest") {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
        <AppHeader
          rightSlot={
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[var(--auth-primary)] hover:text-[var(--auth-primary-hover)]"
            >
              로그인
            </Link>
          }
        />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">

        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <AppHeader showProfileMenu />
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--auth-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">환영합니다</h1>
          {selectedProfile && (
            <p className="mt-2 text-lg text-[var(--auth-primary)]">
              {selectedProfile.nickname}
            </p>
          )}
          <p className="mt-4 text-sm text-[var(--auth-muted)]">
            시청 홈은 준비 중입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
