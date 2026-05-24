"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuth,
  getProfileUserId,
  isLoggedIn,
} from "@/lib/auth-storage";

export default function HomePage() {
  const router = useRouter();
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/auth/login");
      return;
    }
    setProfileUserId(getProfileUserId());
    setReady(true);
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--auth-page-bg)] text-[var(--auth-muted)]">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <header className="flex items-center justify-between border-b border-[var(--auth-border)] bg-white px-6 py-4">
        <span className="text-xl font-bold">OTT</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-[var(--auth-muted)] hover:text-[var(--foreground)]"
        >
          로그아웃
        </button>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--auth-border)] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">환영합니다</h1>
          {profileUserId != null && (
            <p className="mt-2 text-sm text-[var(--auth-muted)]">
              사용자 ID: {profileUserId}
            </p>
          )}
          <p className="mt-4 text-xs text-[var(--auth-subtle)]">
            프로필 정보는 추후 API에서 불러올 예정입니다.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block text-sm text-[var(--auth-primary)] hover:text-[var(--auth-primary-hover)]"
          >
            로그인 페이지로
          </Link>
        </div>
      </main>
    </div>
  );
}
