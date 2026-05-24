"use client";

import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpForm } from "@/components/auth/OtpForm";
import { useRequireSignupEmail } from "@/hooks/useRequireSignupEmail";
import { requestEmailVerification } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";

export default function VerifyPage() {
  const email = useRequireSignupEmail();
  const sentRef = useRef(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || sentRef.current) return;
    sentRef.current = true;

    requestEmailVerification(email).catch((err) =>
        setSendError(
          err instanceof ApiError ? err.message : "인증번호 발송에 실패했습니다.",
        ),
      );
  }, [email]);

  if (!email) {
    return null;
  }

  return (
    <AuthLayout title="이메일로 시작" showBack backHref="/auth/identity">
      {sendError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {sendError}
        </p>
      )}
      <OtpForm email={email} />
    </AuthLayout>
  );
}
