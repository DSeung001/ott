"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  hasSelectedProfile,
  isLoggedIn,
} from "@/lib/auth-storage";

export function useRequireAuth(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/auth/login");
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}

/** 로그인 사용자는 리다이렉트하고, 비로그인만 auth 페이지 표시 */
export function useAuthGuestOnly(): boolean {
  const router = useRouter();
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(hasSelectedProfile() ? "/" : "/profile");
      return;
    }
    setCanShow(true);
  }, [router]);

  return canShow;
}

export type HomeAuthState = "loading" | "guest" | "needsProfile" | "ready";

export function useHomeAuthState(): HomeAuthState {
  const router = useRouter();
  const [state, setState] = useState<HomeAuthState>("loading");

  useEffect(() => {
    if (!isLoggedIn()) {
      setState("guest");
      return;
    }
    if (!hasSelectedProfile()) {
      router.replace("/profile");
      return;
    }
    setState("ready");
  }, [router]);

  return state;
}
