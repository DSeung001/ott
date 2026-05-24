"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { saveAuth } from "@/lib/auth-storage";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

type LoginPasswordFormProps = {
  email: string;
  onBack: () => void;
};

export function LoginPasswordForm({ email, onBack }: LoginPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      saveAuth(result.token, result.user.id);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthInput label="이메일" type="email" value={email} readOnly />
      <AuthInput
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" disabled={loading}>
        {loading ? "로그인 중..." : "다음"}
      </AuthButton>
      <AuthButton type="button" variant="secondary" onClick={onBack}>
        이메일 다시 입력
      </AuthButton>
    </form>
  );
}
