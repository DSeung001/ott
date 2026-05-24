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
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!email || sentRef.current) return;
    sentRef.current = true;

    requestEmailVerification(email)
      .then((res) => setSentMessage(res.message))
      .catch((err) =>
        setSendError(
          err instanceof ApiError ? err.message : "인증번호 발송에 실패했습니다.",
        ),
      );
  }, [email]);

  if (!email) {
    return null;
  }

  return (
    <AuthLayout
      title="이메일 인증"
      subtitle="발송된 인증번호를 입력해 주세요."
      showBack
      backHref="/auth/identity"
    >
      {sendError && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {sendError}
        </p>
      )}
      {sentMessage && !sendError && (
        <p className="mb-4 text-sm text-emerald-600" role="status">
          {sentMessage}
        </p>
      )}
      <OtpForm email={email} />
    </AuthLayout>
  );
}
