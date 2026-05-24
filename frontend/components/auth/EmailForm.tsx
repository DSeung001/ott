"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkEmailSignup } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { setSignupEmail } from "@/lib/auth-session";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";

type EmailFormProps = {
  onExist: (email: string) => void;
};

export function EmailForm({ onExist }: EmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await checkEmailSignup(email);
      if (result.status === "EXIST") {
        onExist(email.trim().toLowerCase());
        return;
      }
      setSignupEmail(email);
      router.push("/auth/identity");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "이메일 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthInput
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <AuthButton type="submit" disabled={loading}>
        {loading ? "확인 중..." : "다음"}
      </AuthButton>
    </form>
  );
}
