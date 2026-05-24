"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyIdentityMock } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { formatKoreanPhoneNumber } from "@/lib/format-phone";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

type IdentityFormProps = {
  email: string;
};

export function IdentityForm({ email }: IdentityFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatKoreanPhoneNumber(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyIdentityMock(
        email,
        name.trim() || "tester",
        phone.trim() || "010-1234-5678",
      );
      router.push("/auth/verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "본인인증에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-[var(--auth-muted)]">
        가입 이메일:{" "}
        <span className="font-medium text-[var(--foreground)]">{email}</span>
      </p>
      <AuthInput
        label="이름"
        type="text"
        autoComplete="name"
        placeholder="홍길동"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <AuthInput
        label="휴대폰 번호"
        type="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
        value={phone}
        onChange={handlePhoneChange}
        maxLength={13}
      />
      <p className="text-xs text-[var(--auth-subtle)]">
        개발 환경에서는 Mock 본인인증이 적용됩니다. 비워두면 기본값이 사용됩니다.
      </p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" disabled={loading}>
        {loading ? "인증 중..." : "본인인증 완료"}
      </AuthButton>
    </form>
  );
}
