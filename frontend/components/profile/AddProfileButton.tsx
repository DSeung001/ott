"use client";

type AddProfileButtonProps = {
  onClick: () => void;
};

export function AddProfileButton({ onClick }: AddProfileButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-28 flex-col items-center gap-3 transition hover:opacity-90"
    >
      <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-[var(--auth-border-strong)] bg-white text-3xl text-[var(--auth-muted)] transition group-hover:border-[var(--auth-primary)] group-hover:text-[var(--auth-primary)]">
        +
      </span>
      <span className="text-sm font-medium text-[var(--foreground)]">
        새 프로필
      </span>
    </button>
  );
}
