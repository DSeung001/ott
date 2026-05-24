"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { saveAuth } from "@/lib/auth-storage";
import { clearSignupEmail } from "@/lib/auth-session";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

type PasswordFormProps = {
  email: string;
};

export function PasswordForm({ email }: PasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const result = await signup(email, password, passwordConfirm);
      saveAuth(result.token, result.user.id);
      clearSignupEmail();
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-[var(--auth-muted)]">
        마지막 단계입니다. 사용할 비밀번호를 설정하세요.
      </p>
      <AuthInput
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <AuthInput
        label="비밀번호 확인"
        type="password"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" disabled={loading}>
        {loading ? "가입 중..." : "회원가입 완료"}
      </AuthButton>
    </form>
  );
}
