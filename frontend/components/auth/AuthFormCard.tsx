type AuthFormCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AuthFormCard({ children, className = "" }: AuthFormCardProps) {
  return (
    <div
      className={`w-full rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] p-8 shadow-sm sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
