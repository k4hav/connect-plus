import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { IssueCard } from "@/components/issues/IssueCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { fetchIssueFeed } from "@/lib/data/issues";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { cn, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "My Activity" };

const TABS = [
  { key: "reported", label: "Reported by me" },
  { key: "supported", label: "Supported by me" },
  { key: "comments", label: "My comments" },
] as const;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as (typeof TABS)[number]["key"]) : "reported";
  const page = parsePage(sp.page);

  let body: React.ReactNode;
  let total = 0;

  if (tab === "comments") {
    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await supabase
      .from("issue_comments")
      .select("id, comment, created_at, issue_id, issues(title)", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    total = count ?? 0;
    body = !data?.length ? (
      <EmptyState icon={Activity} title="No comments yet">Join a discussion on any issue.</EmptyState>
    ) : (
      <ul className="space-y-3">
        {data.map((c) => {
          const rel = Array.isArray(c.issues) ? c.issues[0] : c.issues;
          return (
            <li key={c.id} className="glass rounded-2xl p-4">
              <Link href={`/issues/${c.issue_id}`} className="text-sm font-medium text-cyan hover:underline">{(rel as { title?: string } | null)?.title ?? "Issue"}</Link>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{c.comment}</p>
            </li>
          );
        })}
      </ul>
    );
  } else {
    const r = await fetchIssueFeed({ page, sort: "newest", ...(tab === "reported" ? { createdBy: user.id } : { supportedOnly: true }) });
    total = r.total;
    body = r.issues.length === 0 ? (
      <EmptyState icon={Activity} title="Nothing here yet">{tab === "reported" ? "Issues you raise will appear here." : "Issues you support will appear here."}</EmptyState>
    ) : (
      <div className="grid gap-4 md:grid-cols-2">{r.issues.map((i) => <IssueCard key={i.id} issue={i} siteUrl={SITE_URL} />)}</div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My Activity</h1>
      </header>
      <nav aria-label="Activity tabs" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/activity?tab=${t.key}`} aria-current={t.key === tab ? "page" : undefined}
            className={cn("rounded-xl border px-3.5 py-2 text-sm", t.key === tab ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-white/5 text-muted hover:text-ink")}>
            {t.label}
          </Link>
        ))}
      </nav>
      {body}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/activity" params={{ tab }} />
    </div>
  );
}
