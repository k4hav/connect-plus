import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MoreMenu } from "./MoreMenu";

export function TopBar({ unread, name, isStaff, githubRepoUrl }: { unread: number; name: string; isStaff: boolean; githubRepoUrl: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <header className="glass-panel sticky top-3 z-30 mb-4 flex h-[62px] items-center justify-between rounded-[20px] px-4 sm:px-5">
      <Link href="/dashboard" aria-label="Connect⁺ home">
        <Logo size="md" />
      </Link>
      <div className="flex items-center gap-2">
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
