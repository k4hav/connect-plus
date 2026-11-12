"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Bug, Code2, Info, Lightbulb, ShieldCheck, User, Users } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

type Props = { isStaff: boolean; githubRepoUrl: string; initial: string };

const LINKS = [
  { href: "/profile", label: "My profile", icon: User },
  { href: "/followed", label: "Issues I follow", icon: Bookmark },
  { href: "/about", label: "About Connect⁺", icon: Info },
  { href: "/contributors", label: "Contributors", icon: Users },
  { href: "/developer", label: "Developer", icon: Code2 },
  { href: "/feedback", label: "Send feedback", icon: Lightbulb },
  { href: "/report-bug", label: "Report a bug", icon: Bug },
];

export function MoreMenu({ isStaff, githubRepoUrl, initial }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const row = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-ink";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open menu"
        className="glass inline-flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-cyan transition-colors hover:border-cyan/40"
      >
        {initial}
      </button>
      {open && (
        <div role="menu" className="glass-strong absolute right-0 top-13 z-50 w-64 rounded-2xl p-2 shadow-float">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className={row}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" /> {label}
            </Link>
          ))}
          {githubRepoUrl && (
            <a href={githubRepoUrl} target="_blank" rel="noopener noreferrer" role="menuitem" className={row}>
              <Code2 className="h-[18px] w-[18px]" aria-hidden="true" /> Contribute on GitHub
            </a>
          )}
          {isStaff && (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={row}>
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" /> Admin
            </Link>
          )}
          <div className="mt-1 border-t border-white/5 pt-1">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
