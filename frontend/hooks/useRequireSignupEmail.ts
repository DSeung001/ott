"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignupEmail } from "@/lib/auth-session";

export function useRequireSignupEmail(): string | null {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = getSignupEmail();
    if (!stored) {
      router.replace("/auth/email");
      return;
    }
    setEmail(stored);
  }, [router]);

  return email;
}
