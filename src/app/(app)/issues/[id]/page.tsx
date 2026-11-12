import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Clock, Heart, Mail, MapPin, Megaphone, Pencil, Bookmark, User } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { parsePage } from "@/components/ui/pagination";
import { Timeline } from "@/components/issues/detail/Timeline";
import { EvidenceSection } from "@/components/issues/detail/EvidenceSection";
import { AccountabilitySection } from "@/components/issues/detail/AccountabilitySection";
import { CommentsSection } from "@/components/issues/detail/CommentsSection";
import { StaffPanel } from "@/components/issues/detail/StaffPanel";
import { EmailSentBoard } from "@/components/issues/detail/EmailSentBoard";
import { getSentSummary } from "@/lib/data/email-sent";
import { ReportContent } from "@/components/issues/detail/ReportContent";
import { toggleFollow, toggleSupport } from "@/lib/actions/issues";
import { getStaffRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildDemandPrompt } from "@/lib/demand";
import { COMMENT_PAGE_SIZE } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { cn, SITE_URL } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "Issue" };
  const supabase = await createClient();
  const { data } = await supabase.from("issues").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Issue" };
}

export default async function IssueDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cpage?: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { cpage } = await searchParams;
  const user = await requireUser();
  const role = await getStaffRole();
  const isStaff = !!role;
  const supabase = await createClient();

  const commentPage = parsePage(cpage);
  const from = (commentPage - 1) * COMMENT_PAGE_SIZE;

  const { data: issue } = await supabase.from("issue_feed").select("*").eq("id", id).maybeSingle();
  if (!issue) notFound();

  const [evidence, responses, resolutions, reopen, history, comments, campaigns] = await Promise.all([
    supabase.from("issue_evidence").select("*").eq("issue_id", id).order("submitted_at", { ascending: false }),
    supabase.from("official_responses").select("*").eq("issue_id", id).order("response_date", { ascending: false }),
    supabase.from("issue_resolutions").select("*, resolution_evidence(id, external_url, description)").eq("issue_id", id).order("created_at", { ascending: false }),
    supabase.from("reopen_requests").select("*").eq("issue_id", id).order("created_at", { ascending: false }),
    supabase.from("issue_timeline").select("id, event_type, event_description, actor_name, created_at").eq("issue_id", id).order("created_at", { ascending: false }).limit(30),
    supabase
      .from("issue_comments")
      .select("id, user_id, comment, moderation_status, created_at, profiles(full_name)", { count: "exact" })
      .eq("issue_id", id)
      .order("created_at", { ascending: true })
      .range(from, from + COMMENT_PAGE_SIZE - 1),
    supabase.from("campaigns").select("id, title, status, supporter_count").eq("issue_id", id).order("created_at", { ascending: false }),
  ]);

  const sent = await getSentSummary(id, user.id);
  const evidenceRows = evidence.data ?? [];
  const mine = issue.created_by === user.id;
  const demand = buildDemandPrompt(issue, evidenceRows, SITE_URL);
  const supportAction = toggleSupport.bind(null, id);
  const followAction = toggleFollow.bind(null, id);

  const btn = "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm transition-colors";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        <article className="glass-strong rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={issue.status} />
            <Badge tone="neutral">{issue.category_label ?? issue.category}</Badge>
            {issue.moderation_status === "hidden" && <Badge tone="red">Hidden from feed</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight">{issue.title}</h1>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/50">
            {issue.creator_name && (
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" /> <dt className="sr-only">Raised by</dt>
                <dd>{issue.creator_name}</dd>
              </div>
            )}
            {issue.college_name && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden="true" /> <dt className="sr-only">College</dt>
                <dd>{issue.college_name}</dd>
              </div>
            )}
            {issue.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" /> <dt className="sr-only">Location</dt>
                <dd>{issue.location}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" /> <dt className="sr-only">Reported</dt>
              <dd>{fmtDate(issue.published_at)}</dd>
            </div>
          </dl>

          <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#d4dbe6]">{issue.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-white/5 pt-5">
            <form action={supportAction}>
              <button
                type="submit"
                aria-pressed={issue.supported_by_me}
                className={cn(btn, issue.supported_by_me ? "border-amber/40 bg-amber/10 text-amber" : "border-white/10 bg-white/5 text-ink hover:bg-white/10")}
              >
                <Heart className={cn("h-4 w-4", issue.supported_by_me && "fill-current")} aria-hidden="true" />
                {issue.supported_by_me ? "Supported" : "Support"} · {issue.support_count}
              </button>
            </form>
            <form action={followAction}>
              <button type="submit" aria-pressed={issue.followed_by_me} className={cn(btn, issue.followed_by_me ? "border-cyan/40 bg-cyan/10 text-cyan" : "border-white/10 bg-white/5 text-muted hover:text-ink")}>
                <Bookmark className={cn("h-4 w-4", issue.followed_by_me && "fill-current")} aria-hidden="true" />
                {issue.followed_by_me ? "Following" : "Follow"}
              </button>
            </form>
            <CopyButton variant="primary" icon="spark" label="Copy Demand" copiedLabel="Demand copied" text={demand} />
            <Link href={`/issues/${id}/email`} className={cn(btn, "border-white/10 bg-white/5 text-ink hover:bg-white/10")}>
              <Mail className="h-4 w-4" aria-hidden="true" /> Email authorities
            </Link>
            <Link href={`/campaigns/new?issue=${id}`} className={cn(btn, "border-white/10 bg-white/5 text-ink hover:bg-white/10")}>
              <Megaphone className="h-4 w-4" aria-hidden="true" /> Start campaign
            </Link>
            <CopyButton variant="ghost" icon="link" label="Share" copiedLabel="Link copied" relativeUrl={`/issues/${id}`} />
            {mine && (
              <Link href={`/issues/${id}/edit`} className="inline-flex h-10 items-center gap-1.5 px-2 text-sm text-muted hover:text-ink">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Link>
            )}
          </div>
          <p className="mt-3 text-xs text-white/35">
            Copy Demand puts a ready prompt on your clipboard. Paste it into ChatGPT, Gemini, Claude or any AI tool, review the email it writes, then come back to send it.
          </p>
          {!mine && (
            <div className="mt-3">
              <ReportContent type="issue" id={id} issueId={id} />
            </div>
          )}
        </article>

        {(campaigns.data ?? []).length > 0 && (
          <section className="glass rounded-2xl p-5" aria-labelledby="camp-h">
            <h2 id="camp-h" className="text-lg font-medium">Campaigns</h2>
            <ul className="mt-3 space-y-2">
              {(campaigns.data ?? []).map((c) => (
                <li key={c.id}>
                  <Link href={`/campaigns/${c.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3.5 py-2.5 text-sm hover:border-white/20">
                    <span>{c.title}</span>
                    <span className="text-xs text-muted">{c.supporter_count} supporters · {c.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <EmailSentBoard summary={sent} />

        <EvidenceSection issueId={id} evidence={evidenceRows} isStaff={isStaff} />
        <AccountabilitySection
          issueId={id}
          issueStatus={issue.status}
          responses={responses.data ?? []}
          resolutions={resolutions.data ?? []}
          reopenRequests={reopen.data ?? []}
          isStaff={isStaff}
        />
        <CommentsSection
          issueId={id}
          comments={(comments.data ?? []) as never}
          total={comments.count ?? 0}
          page={commentPage}
          currentUserId={user.id}
          isStaff={isStaff}
        />
      </div>

      <aside className="space-y-6">
        {isStaff && <StaffPanel issueId={id} status={issue.status} hidden={issue.moderation_status === "hidden"} />}
        <section className="glass rounded-2xl p-5" aria-labelledby="hist-h">
          <h2 id="hist-h" className="text-lg font-medium">Accountability history</h2>
          <p className="mb-4 mt-1 text-xs text-muted">Append-only. Corrections are added as new events, never rewritten.</p>
          <Timeline events={(history.data ?? []) as never} />
        </section>
      </aside>
    </div>
  );
}
