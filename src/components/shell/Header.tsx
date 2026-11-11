import Link from "next/link";
import { Bell, PlusCircle, Search } from "lucide-react";

export function Header({ unread, name }: { unread: number; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return (
    <div className="mb-6 flex items-center gap-3">
      <form action="/issues" role="search" className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
        <input
          name="q"
          type="search"
          maxLength={80}
          placeholder="Search issues"
          aria-label="Search issues"
          className="glass h-11 w-full rounded-2xl pl-10 pr-4 text-sm text-ink placeholder:text-white/35 focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20"
        />
      </form>
      <Link
        href="/issues/new"
        className="hidden h-11 items-center gap-2 rounded-2xl bg-cyan px-4 text-sm font-medium text-[#04121b] transition-colors hover:bg-bright sm:inline-flex"
      >
        <PlusCircle className="h-4 w-4" aria-hidden="true" /> Raise Issue
      </Link>
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
      <Link
        href="/profile"
        aria-label="Your profile"
        className="glass inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-cyan"
      >
        {initial}
      </Link>
    </div>
  );
}
