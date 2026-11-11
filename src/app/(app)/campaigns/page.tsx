import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { fmtDate, truncate } from "@/lib/format";

export const metadata: Metadata = { title: "Campaigns" };

function issueTitle(rel: unknown): string | null {
  const r = Array.isArray(rel) ? rel[0] : rel;
  return (r as { title?: string } | null)?.title ?? null;
}

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireUser();
  const page = parsePage((await searchParams).page);
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("campaigns")
    .select("id, title, description, status, start_date, supporter_count, issues(title)", { count: "exact" })
    .order("status", { ascending: true })
    .order("supporter_count", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-muted">Organized efforts around an issue. Supporter counts are real, one per student.</p>
      </header>
      {!data?.length ? (
        <EmptyState icon={Megaphone} title="No campaigns yet">
          Open an issue and choose “Start campaign” to organize collective action around it.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="glass glass-hover rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status}</Badge>
                <span className="text-xs text-white/40">Since {fmtDate(c.start_date)}</span>
              </div>
              <h2 className="mt-2 text-lg font-medium">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">{truncate(c.description, 150)}</p>
              <p className="mt-3 text-xs text-white/45">
                {c.supporter_count} supporter{c.supporter_count === 1 ? "" : "s"}
                {issueTitle(c.issues) ? ` · ${truncate(issueTitle(c.issues)!, 50)}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/campaigns" />
    </div>
  );
}
