"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-api";
import {
  clearAuth,
  clearSelectedProfile,
  getSelectedProfile,
} from "@/lib/auth-storage";
import { getAvatarColor, getAvatarInitial } from "@/lib/profile-avatar";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[var(--auth-muted)] transition ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function MenuRow({
  icon,
  label,
  trailing,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--auth-page-bg)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[var(--auth-muted)]">
        {icon}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {trailing && (
        <span className="text-sm text-[var(--auth-subtle)]">{trailing}</span>
      )}
    </button>
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const profile = getSelectedProfile();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (!profile) return null;

  const avatarBg = getAvatarColor(profile.nickname);
  const initial = getAvatarInitial(profile.nickname);

  const handleChangeProfile = () => {
    setOpen(false);
    clearSelectedProfile();
    router.push("/profile");
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬 세션은 제거
    } finally {
      clearAuth();
      router.push("/auth/login");
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-[var(--auth-page-bg)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarBg }}
        >
          {initial}
        </span>
        <span className="max-w-[120px] truncate text-sm font-medium text-[var(--foreground)]">
          {profile.nickname}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--auth-border)] bg-white shadow-lg"
        >
          <button
            type="button"
            onClick={handleChangeProfile}
            className="flex w-full items-center gap-3 border-b border-[var(--auth-border)] px-4 py-4 text-left transition hover:bg-[var(--auth-page-bg)]"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: avatarBg }}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[var(--foreground)]">
                {profile.nickname}
              </p>
              <p className="mt-0.5 text-xs text-[var(--auth-muted)]">
                프로필 변경
              </p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-[var(--auth-subtle)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="border-b border-[var(--auth-border)] py-1">
            <MenuRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              }
              label="OTT 멤버십"
              trailing="베이직"
              onClick={() => alert("멤버십은 준비 중입니다.")}
            />
          </div>

          <div className="py-1">
            <MenuRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              }
              label="설정"
              onClick={() => {
                setOpen(false);
                alert("설정은 준비 중입니다.");
              }}
            />
            <MenuRow
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              }
              label="로그아웃"
              onClick={handleLogout}
            />
          </div>
        </div>
      )}
    </div>
  );
}
