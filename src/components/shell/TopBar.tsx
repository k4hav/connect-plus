import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MainNav } from "./MainNav";
import { MoreMenu } from "./MoreMenu";

export function TopBar({ unread, name, isStaff, githubRepoUrl }: { unread: number; name: string; isStaff: boolean; githubRepoUrl: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-white/5 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/dashboard" aria-label="Connect⁺ home" className="justify-self-start">
          <Logo size="md" />
        </Link>
        <MainNav />
        <div className="flex items-center gap-2.5 justify-self-end">
          <Link
            href="/notifications"
            aria-label={unread ? `${unread} unread notifications` : "Notifications"}
            className="glass relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-muted hover:text-ink"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-[#1b1203]">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <MoreMenu isStaff={isStaff} githubRepoUrl={githubRepoUrl} initial={initial} />
        </div>
      </div>
    </header>
  );
}
