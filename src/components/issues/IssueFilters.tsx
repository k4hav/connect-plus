import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ISSUE_STATUSES, SORTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  params: { sort?: string; q?: string; category?: string; college?: string; status?: string };
  categories: { slug: string; label: string }[];
  colleges: { id: string; college_name: string }[];
};

export function IssueFilters({ basePath, params, categories, colleges }: Props) {
  const sort = params.sort ?? "trending";
  const chipHref = (value: string) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.category) sp.set("category", params.category);
    if (params.college) sp.set("college", params.college);
    if (params.status) sp.set("status", params.status);
    sp.set("sort", value);
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sort issues">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={chipHref(s.value)}
            role="tab"
            aria-selected={sort === s.value}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              sort === s.value ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-white/5 text-muted hover:text-ink",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <form action={basePath} className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <input type="hidden" name="sort" value={sort} />
        <div className="space-y-1.5">
          <label htmlFor="f-q" className="label">Search</label>
          <input
            id="f-q"
            name="q"
            defaultValue={params.q}
            maxLength={80}
            placeholder="Keywords"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-ink placeholder:text-white/30 focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20"
          />
        </div>
        <Select name="category" label="Category" defaultValue={params.category ?? ""} placeholder="All categories" options={categories.map((c) => ({ value: c.slug, label: c.label }))} />
        <Select name="college" label="College" defaultValue={params.college ?? ""} placeholder="All colleges" options={colleges.map((c) => ({ value: c.id, label: c.college_name }))} />
        <Select name="status" label="Status" defaultValue={params.status ?? ""} placeholder="Any status" options={Object.entries(ISSUE_STATUSES).map(([value, s]) => ({ value, label: s.label }))} />
        <div className="flex items-end gap-2">
          <Button type="submit" className="h-11">Apply</Button>
          <Link href={`${basePath}?sort=${sort}`} className="inline-flex h-11 items-center px-2 text-sm text-muted hover:text-ink">
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
