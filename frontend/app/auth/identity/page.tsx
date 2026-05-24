"use client";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { IdentityForm } from "@/components/auth/IdentityForm";
import { useRequireSignupEmail } from "@/hooks/useRequireSignupEmail";

export default function IdentityPage() {
  const email = useRequireSignupEmail();

  if (!email) {
    return null;
  }

  return (
    <AuthLayout
      title="본인인증"
      subtitle="서비스 이용을 위해 본인인증을 진행해 주세요."
      showBack
      backHref="/auth/email"
    >
      <IdentityForm email={email} />
    </AuthLayout>
  );
}
