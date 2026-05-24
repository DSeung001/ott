type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function AuthInput({ label, id, className = "", ...props }: AuthInputProps) {
  const inputId = id ?? label;
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-[var(--foreground)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border border-[var(--auth-border-strong)] bg-white px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--auth-subtle)] transition focus:border-[var(--auth-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-focus)]/20 ${className}`}
        {...props}
      />
    </div>
  );
}
