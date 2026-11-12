"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, Home, Landmark, Megaphone, PlusCircle } from "lucide-react";
import { LiquidNavbar, type LiquidNavItem } from "./LiquidNavbar";

const ICON = { className: "h-[18px] w-[18px]", "aria-hidden": true } as const;

const ITEMS: (LiquidNavItem & { href: string })[] = [
  { label: "Home", href: "/dashboard", icon: <Home {...ICON} />, fx: "glow" },
  { label: "Issues", href: "/issues", icon: <Compass {...ICON} />, fx: "spin" },
  { label: "Raise", href: "/issues/new", icon: <PlusCircle {...ICON} />, fx: "pop" },
  { label: "Campaigns", href: "/campaigns", icon: <Megaphone {...ICON} />, fx: "wave" },
  { label: "Authorities", href: "/authorities", icon: <Landmark {...ICON} />, fx: "drop" },
];

function indexFor(pathname: string) {
  if (pathname === "/issues/new") return 2;
  if (pathname === "/issues" || pathname.startsWith("/issues/")) return 1;
  if (pathname.startsWith("/campaigns")) return 3;
  if (pathname.startsWith("/authorities")) return 4;
  if (pathname === "/dashboard") return 0;
  return -1;
}

/** The main menu: a pill of water that follows the page you are on. Bottom of the screen on phones, top on desktop. */
export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(Math.max(0, indexFor(pathname)));

  useEffect(() => {
    const i = indexFor(pathname);
    if (i >= 0) setActive(i);
  }, [pathname]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 md:static md:inset-auto md:z-auto md:px-0">
      <LiquidNavbar
        items={ITEMS}
        active={active}
        tone="dark"
        onChange={(i) => {
          setActive(i);
          router.push(ITEMS[i].href);
        }}
      />
    </div>
  );
}
