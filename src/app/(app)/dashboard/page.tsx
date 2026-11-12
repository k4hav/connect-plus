import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText, Heart, PlusCircle, ThumbsUp, Send } from "lucide-react";
import { IssueCard, type FeedIssue } from "@/components/issues/IssueCard";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CountUp } from "@/components/ui/count-up";
import { timeAgo, truncate } from "@/lib/format";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

const STEPS = [
  { icon: PlusCircle, title: "Raise an issue", text: "Write the problem clearly and add proof." },
  { icon: ThumbsUp, title: "Get support", text: "Other students back it so it cannot be ignored." },
  { icon: Send, title: "Email the authority", text: "Send it to the right person and track the reply." },
];

export default async function DashboardPage() {
  await requireUser();
  const supabase = await createClient();
  const [stats, trending, followed] = await Promise.all([
    supabase.from("platform_stats").select("*").maybeSingle(),
    supabase.from("issue_feed").select("*").order("trending_score", { ascending: false }).limit(4),
    supabase.from("issue_feed").select("id, title, last_activity_at").eq("followed_by_me", true).order("last_activity_at", { ascending: false }).limit(3),
  ]);

  const s = stats.data as Record<string, number> | null;
  const cards = [
    { label: "Issues raised", value: s?.total_issues ?? 0, icon: FileText },
    { label: "Waiting for reply", value: s?.awaiting_action ?? 0, icon: Clock },
    { label: "Solved", value: s?.resolved_issues ?? 0, icon: CheckCircle2 },
    { label: "Student support", value: s?.total_support ?? 0, icon: Heart },
  ];

  return (
    <div className="space-y-8">
      <section className="reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.14] via-cyan-300/[0.07] to-white/[0.04] p-6 sm:p-10">
        <div aria-hidden="true" className="animate-float pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan/20 blur-3xl" />
        <div aria-hidden="true" className="animate-float-delay pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-electric/15 blur-3xl" />
        <p className="relative text-xs font-medium uppercase tracking-[0.22em] text-cyan">Raise Your Voice Together.</p>
        <h1 className="relative mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Problem on campus? <span className="text-shine">Make it heard.</span>
        </h1>
        <p className="reveal relative mt-3 max-w-xl text-[15px] text-muted" style={{ "--i": 1 } as React.CSSProperties}>Report an issue, get other students to support it, and send it to the people who can fix it.</p>
        <div className="reveal relative mt-6 flex flex-wrap gap-3" style={{ "--i": 2 } as React.CSSProperties}>
          <Link href="/issues/new" className="press inline-flex h-11 items-center gap-2 rounded-xl bg-cyan px-5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(255,59,71,0.6)] transition hover:bg-bright">
            <PlusCircle className="h-4 w-4" aria-hidden="true" /> Raise an issue
          </Link>
          <Link href="/issues" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm transition hover:bg-white/10">
            See all issues <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-label="Numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }, n) => (
          <div key={label} className="glass glass-hover reveal rounded-2xl p-4" style={{ "--i": n + 3 } as React.CSSProperties}>
            <Icon className="h-4 w-4 text-cyan" aria-hidden="true" />
            <p className="mt-3 text-3xl font-semibold tabular-nums"><CountUp value={Number(value)} /></p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="how-h">
        <h2 id="how-h" className="mb-3 text-lg font-medium">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="glass glass-hover reveal flex gap-3 rounded-2xl p-4" style={{ "--i": i + 6 } as React.CSSProperties}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/10 text-cyan"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="font-medium">{i + 1}. {title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tr-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="tr-h" className="text-lg font-medium">Popular issues</h2>
          <Link href="/issues" className="text-sm text-cyan hover:underline">See all</Link>
        </div>
        {!trending.data?.length ? (
          <p className="glass rounded-2xl p-5 text-sm text-muted">No issues yet. Be the first to raise one.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{(trending.data as FeedIssue[]).map((i, n) => <IssueCard key={i.id} issue={i} siteUrl={SITE_URL} index={n} />)}</div>
        )}
      </section>

      {!!followed.data?.length && (
        <section aria-labelledby="fo-h">
          <h2 id="fo-h" className="mb-3 text-lg font-medium">Issues you follow</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {followed.data.map((i) => (
              <Link key={i.id} href={`/issues/${i.id}`} className="glass glass-hover rounded-2xl p-4 text-sm">
                <p className="font-medium">{truncate(i.title, 70)}</p>
                <p className="mt-1 text-xs text-muted">Last update {timeAgo(i.last_activity_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
