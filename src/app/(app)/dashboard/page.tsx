import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, Heart, Megaphone, PlusCircle } from "lucide-react";
import { IssueCard, type FeedIssue } from "@/components/issues/IssueCard";
import { Timeline } from "@/components/issues/detail/Timeline";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ISSUE_STATUSES } from "@/lib/constants";
import { compact, timeAgo, truncate } from "@/lib/format";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [stats, counts, trending, activity, responses, followed, me] = await Promise.all([
    supabase.from("platform_stats").select("*").maybeSingle(),
    supabase.from("issue_status_counts").select("status, total"),
    supabase.from("issue_feed").select("*").order("trending_score", { ascending: false }).limit(4),
    supabase.from("issue_timeline").select("id, event_type, event_description, actor_name, created_at, issue_id, issue_title").order("created_at", { ascending: false }).limit(8),
    supabase.from("official_responses").select("id, issue_id, authority_name, response_summary, response_date, verification_status, issues(title)").order("created_at", { ascending: false }).limit(4),
    supabase.from("issue_feed").select("*").eq("followed_by_me", true).order("last_activity_at", { ascending: false }).limit(3),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const s = stats.data as Record<string, number> | null;
  const cards = [
    { label: "Reported issues", value: s?.total_issues ?? 0, icon: FileText },
    { label: "Active campaigns", value: s?.active_campaigns ?? 0, icon: Megaphone },
    { label: "Awaiting action", value: s?.awaiting_action ?? 0, icon: Clock },
    { label: "Resolved", value: s?.resolved_issues ?? 0, icon: CheckCircle2 },
    { label: "Student support", value: s?.total_support ?? 0, icon: Heart },
  ];
  const byStatus = new Map((counts.data ?? []).map((r) => [r.status as string, Number(r.total)]));
  const max = Math.max(1, ...byStatus.values());
  const first = me.data?.full_name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <section className="glass-strong rounded-3xl p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">Raise Your Voice Together.</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Student Accountability Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{first ? `Welcome, ${first}. ` : ""}Raise campus issues, back the ones that matter, and follow each one to a verified outcome.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/issues/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan px-4 text-sm font-medium text-[#04121b] hover:bg-bright"><PlusCircle className="h-4 w-4" aria-hidden="true" /> Raise an Issue</Link>
          <Link href="/issues" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm hover:bg-white/10">Explore Issues</Link>
        </div>
      </section>

      <section aria-label="Platform statistics" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <Icon className="h-4 w-4 text-cyan" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{compact(Number(value))}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="glass rounded-2xl p-5" aria-labelledby="st-h">
        <h2 id="st-h" className="font-medium">Issues by status</h2>
        <ul className="mt-4 space-y-2.5">
          {Object.entries(ISSUE_STATUSES).map(([key, st]) => {
            const n = byStatus.get(key) ?? 0;
            return (
              <li key={key} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 text-xs sm:grid-cols-[11rem_1fr_2.5rem]">
                <span className="truncate text-muted">{st.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-white/5"><span className="block h-full rounded-full bg-cyan/70" style={{ width: `${(n / max) * 100}%` }} /></span>
                <span className="text-right tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="tr-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="tr-h" className="text-lg font-medium">Trending issues</h2>
          <Link href="/issues" className="text-sm text-cyan hover:underline">View all</Link>
        </div>
        {!trending.data?.length ? (
          <p className="glass rounded-2xl p-5 text-sm text-muted">No issues yet. Be the first to raise one.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{(trending.data as FeedIssue[]).map((i) => <IssueCard key={i.id} issue={i} siteUrl={SITE_URL} />)}</div>
        )}
      </section>

      {!!followed.data?.length && (
        <section aria-labelledby="fo-h">
          <h2 id="fo-h" className="mb-3 text-lg font-medium">Issues you follow</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {followed.data.map((i) => (
              <Link key={i.id} href={`/issues/${i.id}`} className="glass glass-hover rounded-2xl p-4 text-sm">
                <p className="font-medium">{truncate(i.title, 70)}</p>
                <p className="mt-1 text-xs text-muted">Last activity {timeAgo(i.last_activity_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5" aria-labelledby="ra-h">
          <h2 id="ra-h" className="mb-4 font-medium">Recent activity</h2>
          <Timeline events={(activity.data ?? []) as never} />
        </section>
        <section className="glass rounded-2xl p-5" aria-labelledby="or-h">
          <h2 id="or-h" className="mb-4 font-medium">Latest official responses</h2>
          {!responses.data?.length ? (
            <p className="text-sm text-muted">No official responses have been recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {responses.data.map((r) => {
                const rel = Array.isArray(r.issues) ? r.issues[0] : r.issues;
                return (
                  <li key={r.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5 text-sm">
                    <Link href={`/issues/${r.issue_id}`} className="text-cyan hover:underline">{(rel as { title?: string } | null)?.title ?? "Issue"}</Link>
                    <p className="mt-1 text-xs text-white/45">{r.authority_name} · {r.verification_status === "verified" ? "Verified" : "Pending verification"}</p>
                    <p className="mt-1 text-muted">{truncate(r.response_summary, 140)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}