import Link from "next/link";
import { ProfileMenu } from "./ProfileMenu";

type AppHeaderProps = {
  showProfileMenu?: boolean;
  rightSlot?: React.ReactNode;
};

export function AppHeader({
  showProfileMenu = false,
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="relative z-40 flex items-center justify-between border-b border-[var(--auth-border)] bg-white px-6 py-3">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-[var(--foreground)]"
      >
        OTT
      </Link>
      <div className="flex items-center gap-3">
        {rightSlot}
        {showProfileMenu && <ProfileMenu />}
      </div>
    </header>
  );
}
