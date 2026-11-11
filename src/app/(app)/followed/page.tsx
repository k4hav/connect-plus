import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { IssueCard } from "@/components/issues/IssueCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { fetchIssueFeed } from "@/lib/data/issues";
import { requireUser } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Followed Issues" };

export default async function FollowedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireUser();
  const page = parsePage((await searchParams).page);
  const { issues, total } = await fetchIssueFeed({ page, followedOnly: true, sort: "updated" });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Followed Issues</h1>
        <p className="mt-1 text-sm text-muted">Issues you follow, most recently active first. You get notified when they change.</p>
      </header>
      {issues.length === 0 ? (
        <EmptyState icon={Bookmark} title="You are not following anything yet">Use “Follow” on any issue to track updates here.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{issues.map((i) => <IssueCard key={i.id} issue={i} siteUrl={SITE_URL} />)}</div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/followed" />
    </div>
  );
}
