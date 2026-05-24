"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthButton } from "@/components/auth/AuthButton";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthLayout subtitle="동시방영 신작부터 역대 인기작까지 한 곳에서 편-안하게!">
      <div className="space-y-8 text-center">
        <AuthButton onClick={() => router.push("/auth/email")}>
          이메일로 시작
        </AuthButton>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--auth-border)]" />
          <span className="text-sm text-[var(--auth-muted)]">또는</span>
          <div className="h-px flex-1 bg-[var(--auth-border)]" />
        </div>

        <OAuthButtons />

        <p className="text-sm text-[var(--auth-muted)]">
          <Link
            href="/auth/login"
            className="underline hover:text-[var(--foreground)]"
          >
            로그인에 어려움을 겪고 계신가요?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
