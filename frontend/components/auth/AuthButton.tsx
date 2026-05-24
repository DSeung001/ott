type AuthButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function AuthButton({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: AuthButtonProps) {
  const base =
    "w-full rounded-lg px-4 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-[var(--auth-primary)] text-white hover:bg-[var(--auth-primary-hover)]",
    secondary:
      "border border-[var(--auth-border-strong)] bg-white text-[var(--foreground)] hover:border-[var(--auth-muted)] hover:bg-[var(--auth-page-bg)]",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
