import Link from "next/link";
import { AuthFormCard } from "./AuthFormCard";

type AuthLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  /** false면 카드 테두리 없이 children만 렌더 */
  card?: boolean;
};

export function AuthLayout({
  children,
  title,
  subtitle,
  showBack = false,
  backHref = "/auth/login",
  card = true,
}: AuthLayoutProps) {
  const inner = (
    <>
      {showBack && (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center text-sm text-[var(--auth-muted)] hover:text-[var(--foreground)]"
        >
          ← 뒤로
        </Link>
      )}
      {(title || subtitle) && (
        <div className={`text-center ${showBack ? "" : "pt-0"} mb-8`}>
          {title && (
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--auth-muted)]">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <header className="border-b border-[var(--auth-border)] bg-white px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[var(--foreground)]"
        >
          OTT
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 pb-16">
        <div className="w-full max-w-xl">
          {card ? <AuthFormCard>{inner}</AuthFormCard> : inner}
        </div>
      </main>
    </div>
  );
}
