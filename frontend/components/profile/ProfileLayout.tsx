type ProfileLayoutProps = {
  children: React.ReactNode;
};

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--auth-page-bg)] text-[var(--foreground)]">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">{children}</div>
      </main>
    </div>
  );
}
