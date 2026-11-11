import Link from "next/link";
import { Heart, MapPin, MessageSquare, Building2, Clock } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { toggleSupport } from "@/lib/actions/issues";
import { buildDemandPrompt } from "@/lib/demand";
import { fmtDate, truncate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FeedIssue = {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label: string | null;
  college_name: string | null;
  location: string | null;
  status: string;
  support_count: number;
  comment_count: number;
  published_at: string;
  supported_by_me: boolean;
  followed_by_me?: boolean;
};

export function IssueCard({ issue, siteUrl }: { issue: FeedIssue; siteUrl: string }) {
  const supportAction = toggleSupport.bind(null, issue.id);
  return (
    <article className="glass glass-hover flex flex-col rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={issue.status} />
        <Badge tone="neutral">{issue.category_label ?? issue.category}</Badge>
      </div>

      <h3 className="mt-3 text-lg font-medium leading-snug">
        <Link href={`/issues/${issue.id}`} className="hover:text-cyan">
          {issue.title}
        </Link>
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{truncate(issue.description, 170)}</p>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
        {issue.college_name && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <dt className="sr-only">College</dt>
            <dd>{issue.college_name}</dd>
          </div>
        )}
        {issue.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <dt className="sr-only">Location</dt>
            <dd>{issue.location}</dd>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <dt className="sr-only">Reported</dt>
          <dd>{fmtDate(issue.published_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
        <form action={supportAction}>
          <button
            type="submit"
            aria-pressed={issue.supported_by_me}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors",
              issue.supported_by_me
                ? "border-amber/40 bg-amber/10 text-amber"
                : "border-white/10 bg-white/5 text-muted hover:text-ink",
            )}
          >
            <Heart className={cn("h-4 w-4", issue.supported_by_me && "fill-current")} aria-hidden="true" />
            {issue.support_count}
            <span className="sr-only">{issue.supported_by_me ? "Remove support" : "Support this issue"}</span>
          </button>
        </form>
        <Link
          href={`/issues/${issue.id}#comments`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-muted hover:text-ink"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          {issue.comment_count}
          <span className="sr-only">comments</span>
        </Link>
        <div className="ml-auto flex gap-2">
          <CopyButton
            size="sm"
            variant="secondary"
            icon="spark"
            label="Copy Demand"
            text={buildDemandPrompt(issue, [], siteUrl)}
          />
          <CopyButton size="sm" variant="ghost" icon="link" label="Share" copiedLabel="Link copied" relativeUrl={`/issues/${issue.id}`} />
        </div>
      </div>
    </article>
  );
}
