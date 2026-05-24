"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmEmailVerification,
  requestEmailVerification,
} from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

type OtpFormProps = {
  email: string;
};

export function OtpForm({ email }: OtpFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await requestEmailVerification(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "재발송에 실패했습니다.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmEmailVerification(email, code);
      router.push("/auth/password");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "인증에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3 text-center">
        <p className="text-base font-semibold text-[var(--auth-primary)]">
          {email}
        </p>
        <p className="text-sm text-[var(--auth-muted)]">
          이메일로 발송된 인증번호 6자리를 입력해주세요.
        </p>
      </div>

      <AuthInput
        label="인증번호"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="인증번호 6자리"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        required
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" disabled={loading || code.length !== 6}>
        {loading ? "확인 중..." : "다음"}
      </AuthButton>
      <AuthButton
        type="button"
        variant="secondary"
        disabled={resending}
        onClick={handleResend}
      >
        {resending ? "발송 중..." : "인증번호 재발송"}
      </AuthButton>
    </form>
  );
}
