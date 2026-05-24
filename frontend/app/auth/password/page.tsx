"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { useRequireSignupEmail } from "@/hooks/useRequireSignupEmail";

export default function PasswordPage() {
  const email = useRequireSignupEmail();

  if (!email) {
    return null;
  }

  return (
    <AuthLayout
      title="비밀번호 설정"
      showBack
      backHref="/auth/verify"
    >
      <PasswordForm email={email} />
    </AuthLayout>
  );
}
