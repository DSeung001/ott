"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailForm } from "@/components/auth/EmailForm";
import { LoginPasswordForm } from "@/components/auth/LoginPasswordForm";

export default function EmailPage() {
  const [existEmail, setExistEmail] = useState<string | null>(null);

  return (
    <AuthLayout
      title="이메일로 시작"
      showBack
      backHref="/auth/login"
    >
      {existEmail ? (
        <LoginPasswordForm
          email={existEmail}
          onBack={() => setExistEmail(null)}
        />
      ) : (
        <EmailForm onExist={setExistEmail} />
      )}
    </AuthLayout>
  );
}
