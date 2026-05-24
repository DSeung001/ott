"use client";

const providers = [
  { id: "google", label: "G", name: "Google" },
  { id: "apple", label: "", name: "Apple" },
  { id: "kakao", label: "K", name: "Kakao" },
] as const;

export function OAuthButtons() {
  const handleClick = () => {
    alert("OAuth는 준비 중입니다.");
  };

  return (
    <div className="flex justify-center gap-4">
      {providers.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={handleClick}
          aria-label={`${p.name} 로그인 (준비 중)`}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--auth-border-strong)] bg-white text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--auth-muted)] hover:bg-[var(--auth-page-bg)]"
        >
          {p.id === "apple" ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          ) : (
            p.label
          )}
        </button>
      ))}
    </div>
  );
}
