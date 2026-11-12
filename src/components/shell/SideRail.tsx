"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Bug, Code2, Info, Lightbulb, User, Users } from "lucide-react";
import { ITEMS, indexFor } from "./MainNav";

const ROW = 46; // height of one menu row in px
const GAP = 6;
const PAD = 10;

const ICON = { className: "h-[18px] w-[18px]", "aria-hidden": true } as const;
const MORE = [
  { href: "/profile", label: "My profile", icon: <User {...ICON} /> },
  { href: "/followed", label: "Issues I follow", icon: <Bookmark {...ICON} /> },
  { href: "/about", label: "About Connect⁺", icon: <Info {...ICON} /> },
  { href: "/contributors", label: "Contributors", icon: <Users {...ICON} /> },
  { href: "/developer", label: "Developer", icon: <Code2 {...ICON} /> },
  { href: "/feedback", label: "Send feedback", icon: <Lightbulb {...ICON} /> },
  { href: "/report-bug", label: "Report a bug", icon: <Bug {...ICON} /> },
];

/** Desktop menu on the left: icon + full name. A glass drop slides to the page you are on. */
export function SideRail() {
  const pathname = usePathname();
  const found = indexFor(pathname);
  const [active, setActive] = useState(Math.max(0, found));
  const [moving, setMoving] = useState(false);
  const [tapped, setTapped] = useState(-1);
  const first = useRef(true);

  useEffect(() => {
    if (found < 0) return;
    setActive((prev) => {
      if (prev !== found && !first.current) {
        setMoving(true);
        window.setTimeout(() => setMoving(false), 520);
      }
      return found;
    });
    first.current = false;
  }, [found]);

  const row = "relative z-10 flex items-center justify-center gap-3 rounded-full px-0 transition-colors lg:justify-start lg:px-4";

  return (
    <nav
      aria-label="Main"
      className="glass-panel flex min-h-0 w-[68px] flex-1 flex-col overflow-y-auto rounded-[26px] lg:w-[236px]"
      style={{ padding: PAD }}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className={`side-drop ${moving ? "is-moving" : ""}`}
          style={{ top: active * (ROW + GAP), left: 0, right: 0, height: ROW }}
        />
        <ul className="relative flex flex-col" style={{ gap: GAP }}>
          {ITEMS.map((it, i) => (
            <li key={it.href} className="group relative">
              <Link
                href={it.href}
                aria-label={it.label}
                title={it.label}
                aria-current={i === active ? "page" : undefined}
                onClick={() => { setTapped(i); window.setTimeout(() => setTapped(-1), 600); }}
                className={`${row} ${i === active ? "text-white" : "text-white/65 hover:text-white"}`}
                style={{ height: ROW }}
              >
                <span key={tapped === i ? "t" : "n"} className={tapped === i ? "side-icon-pop" : "inline-flex"}>{it.icon}</span>
                <span className="hidden text-[15px] font-medium lg:inline">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto" />
      <div className="my-3 h-px bg-white/10" />
      <p className="mb-1 hidden px-4 text-[11px] font-medium uppercase tracking-wider text-white/40 lg:block">More</p>
      <ul className="flex flex-col gap-0.5">
        {MORE.map((m) => {
          const on = pathname === m.href || pathname.startsWith(m.href + "/");
          return (
            <li key={m.href} className="group relative">
              <Link
                href={m.href}
                aria-label={m.label}
                title={m.label}
                className={`flex h-10 items-center justify-center gap-3 rounded-full text-sm transition-colors lg:justify-start lg:px-4 ${on ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
              >
                {m.icon}
                <span className="hidden lg:inline">{m.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
