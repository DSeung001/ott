"use client";

import { useAuthGuestOnly } from "@/hooks/useAuthGuard";
import { PageLoading } from "@/components/layout/PageLoading";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canShow = useAuthGuestOnly();

  if (!canShow) {
    return <PageLoading />;
  }

  return children;
}
