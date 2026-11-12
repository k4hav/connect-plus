import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MoreMenu } from "./MoreMenu";

/** Small glass box with the logo. */
export function LogoBox({ className = "" }: { className?: string }) {
  return (
    <Link href="/dashboard" aria-label="Connect⁺ home" className={`glass-panel flex h-[54px] shrink-0 items-center justify-center rounded-2xl px-4 ${className}`}>
      <Logo size="md" />
    </Link>
  );
}

/** Top row: no big strip. Phone shows the logo box on the left; both show a small box with bell + profile on the right. */
export function TopBar({ unread, name, isStaff, githubRepoUrl }: { unread: number; name: string; isStaff: boolean; githubRepoUrl: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <header className="sticky top-3 z-30 mb-3 flex items-center justify-between md:justify-end">
      <LogoBox className="md:hidden" />
      <div className="glass-panel flex h-[54px] items-center gap-1 rounded-2xl px-2">
        <Link
          href="/notifications"
          aria-label={unread ? `${unread} unread notifications` : "Notifications"}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-[#1b1203]">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
        <MoreMenu isStaff={isStaff} githubRepoUrl={githubRepoUrl} initial={initial} />
      </div>
    </header>
  );
}
