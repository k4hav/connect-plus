import type { Metadata } from "next";
import Link from "next/link";
import { Compass, PlusCircle } from "lucide-react";
import { IssueCard } from "@/components/issues/IssueCard";
import { IssueFilters } from "@/components/issues/IssueFilters";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { fetchIssueFeed } from "@/lib/data/issues";
import { getCategories, getColleges } from "@/lib/data/reference";
import { requireUser } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Explore Issues" };

type SP = { sort?: string; q?: string; category?: string; college?: string; status?: string; page?: string };

export default async function ExploreIssuesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const [{ issues, total, error }, categories, colleges] = await Promise.all([
    fetchIssueFeed({ ...sp, page }),
    getCategories(),
    getColleges(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Explore Issues</h1>
          <p className="mt-1 text-sm text-muted">Support issues you agree with. Support shows popularity, not verified fact.</p>
        </div>
        <Link href="/issues/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan px-4 text-sm font-medium text-[#04121b] hover:bg-bright">
          <PlusCircle className="h-4 w-4" aria-hidden="true" /> Raise an Issue
        </Link>
      </header>

      <IssueFilters basePath="/issues" params={sp} categories={categories.filter((c) => c.is_active)} colleges={colleges} />

      {error && <Alert kind="error">Could not load issues right now. Please refresh.</Alert>}

      {!error && issues.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No issues match yet"
          action={
            <Link href="/issues/new" className="inline-flex h-10 items-center rounded-xl bg-cyan px-4 text-sm font-medium text-[#04121b] hover:bg-bright">
              Raise the first issue
            </Link>
          }
        >
          Try clearing a filter, or be the first to raise an issue for your college.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {issues.map((i) => (
            <IssueCard key={i.id} issue={i} siteUrl={SITE_URL} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/issues" params={{ sort: sp.sort, q: sp.q, category: sp.category, college: sp.college, status: sp.status }} />
    </div>
  );
}
