import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params = {},
  pageParam = "page",
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  pageParam?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set(pageParam, String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const btn = "inline-flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(btn, "hover:bg-white/10")}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(btn, "hover:bg-white/10")}>
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function parsePage(value: string | undefined) {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 && n < 10000 ? n : 1;
}
