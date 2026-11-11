"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { ADMIN_ITEM, NAV_GROUPS, type NavItem } from "./nav";
import { SignOutButton } from "./SignOutButton";

type Props = { isStaff: boolean; githubRepoUrl: string };

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href === "/issues") return pathname === "/issues" || (pathname.startsWith("/issues/") && pathname !== "/issues/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Item({ item, pathname, collapsed, repo, onNavigate }: { item: NavItem; pathname: string; collapsed?: boolean; repo: string; onNavigate?: () => void }) {
  const Icon = item.icon;
  const cls = cn(
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
    collapsed && "justify-center px-0",
  );

  if (item.github) {
    if (!repo) {
      return (
        <span
          className={cn(cls, "cursor-not-allowed text-white/25")}
          title="The GitHub repository link is not configured yet"
          aria-disabled="true"
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </span>
      );
    }
    return (
      <a href={repo} target="_blank" rel="noopener noreferrer" className={cn(cls, "text-muted hover:bg-white/5 hover:text-ink")} title={collapsed ? item.label : undefined}>
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </a>
    );
  }

  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(cls, active ? "bg-cyan/10 text-cyan shadow-[inset_0_0_0_1px_rgba(67,207,255,0.18)]" : "text-muted hover:bg-white/5 hover:text-ink")}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function NavList({ collapsed, onNavigate, isStaff, repo }: { collapsed?: boolean; onNavigate?: () => void; isStaff: boolean; repo: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">{group.title}</p>
          ) : (
            <div className="mx-3 mb-1 h-px bg-white/5" />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <Item key={item.label} item={item} pathname={pathname} collapsed={collapsed} repo={repo} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
      {isStaff && (
        <div>
          <div className="mx-3 mb-1 h-px bg-white/5" />
          <Item item={ADMIN_ITEM} pathname={pathname} collapsed={collapsed} repo={repo} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
}

export function Sidebar({ isStaff, githubRepoUrl }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("cp:sidebar") === "1");
    } catch {}
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("cp:sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <>
      {/* Desktop: floating glass rail */}
      <aside
        className={cn(
          "glass-strong sticky top-3 m-3 mr-0 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col rounded-3xl transition-[width] duration-200 md:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-0")}>
          <Logo size="sm" markOnly={collapsed} />
        </div>
        <NavList collapsed={collapsed} isStaff={isStaff} repo={githubRepoUrl} />
        <div className="space-y-1 border-t border-white/5 p-3">
          <SignOutButton collapsed={collapsed} />
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white", collapsed && "justify-center px-0")}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>

      {/* Mobile: top bar + drawer */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between rounded-none border-x-0 border-t-0 px-4 md:hidden">
        <Logo size="sm" />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white/70 hover:bg-white/5">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="glass-strong absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col rounded-r-3xl">
            <div className="flex h-14 items-center justify-between px-5">
              <Logo size="sm" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-white/70 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} isStaff={isStaff} repo={githubRepoUrl} />
            <div className="border-t border-white/5 p-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
