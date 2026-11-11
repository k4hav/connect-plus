import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/ui/action-form";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/ui/copy-button";
import { postCampaignUpdate, setCampaignStatus, toggleCampaignSupport } from "@/lib/actions/campaigns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser();
  const supabase = await createClient();
  const { data: c } = await supabase.from("campaigns").select("*, issues(id, title)").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [updates, mine] = await Promise.all([
    supabase.from("campaign_updates").select("id, body, created_at").eq("campaign_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("campaign_supporters").select("id").eq("campaign_id", id).eq("user_id", user.id).maybeSingle(),
  ]);
  const supported = !!mine.data;
  const isOwner = c.created_by === user.id;
  const links = (Array.isArray(c.external_links) ? c.external_links : []) as { url: string; label: string }[];
  const issue = c.issues as unknown as { id: string; title: string } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <article className="glass-strong rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status}</Badge>
          <span className="text-xs text-white/40">Started {fmtDate(c.start_date)}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{c.title}</h1>
        {issue && (
          <p className="mt-1 text-sm text-muted">
            Issue: <Link href={`/issues/${issue.id}`} className="text-cyan hover:underline">{issue.title}</Link>
          </p>
        )}
        <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#d4dbe6]">{c.description}</p>

        {links.length > 0 && (
          <ul className="mt-4 space-y-1">
            {links.map((l, i) => (
              <li key={i}>
                <a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 break-all text-sm text-cyan hover:underline">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/5 pt-5">
          <form action={toggleCampaignSupport.bind(null, id)}>
            <button
              aria-pressed={supported}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm transition-colors",
                supported ? "border-amber/40 bg-amber/10 text-amber" : "border-white/10 bg-white/5 text-ink hover:bg-white/10",
              )}
            >
              <Heart className={cn("h-4 w-4", supported && "fill-current")} aria-hidden="true" />
              {supported ? "Supporting" : "Support campaign"} · {c.supporter_count}
            </button>
          </form>
          <CopyButton variant="ghost" icon="link" label="Share" copiedLabel="Link copied" relativeUrl={`/campaigns/${id}`} />
          {isOwner && (
            <form action={async (fd: FormData) => {
              "use server";
              const s = String(fd.get("status"));
              if (["active", "paused", "completed", "closed"].includes(s)) await setCampaignStatus(id, s as "active");
            }} className="ml-auto flex items-center gap-2">
              <select name="status" defaultValue={c.status} aria-label="Campaign status" className="h-10 rounded-xl border border-white/10 bg-[#0f1826] px-3 text-sm">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
              <button className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10">Set</button>
            </form>
          )}
        </div>
      </article>

      <section className="glass rounded-2xl p-5" aria-labelledby="upd-h">
        <h2 id="upd-h" className="text-lg font-medium">Updates</h2>
        {isOwner && (
          <ActionForm action={postCampaignUpdate.bind(null, id)} submitLabel="Post update" className="mt-3 space-y-3">
            <Textarea name="body" label="Share progress with supporters" rows={3} maxLength={1500} />
          </ActionForm>
        )}
        {!updates.data?.length ? (
          <p className="mt-4 text-sm text-muted">No updates yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {updates.data.map((u) => (
              <li key={u.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
                <p className="whitespace-pre-wrap break-words text-sm text-muted">{u.body}</p>
                <p className="mt-1.5 text-xs text-white/35">{timeAgo(u.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}