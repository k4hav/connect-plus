import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { reviewReopen, reviewResolution } from "@/lib/actions/accountability";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Resolutions" };

function Review({ action }: { action: (p: never, f: FormData) => Promise<never> }) {
  return (
    <ActionForm action={action as never} hideSubmit resetOnSuccess={false} className="mt-3 space-y-2">
      <Input name="note" label="Review note (optional)" maxLength={500} />
      <div className="flex gap-2">
        <button name="decision" value="approve" className="h-10 rounded-xl bg-emerald/80 px-4 text-sm font-medium text-white hover:bg-emerald">Approve</button>
        <button name="decision" value="reject" className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm hover:bg-white/10">Reject</button>
      </div>
    </ActionForm>
  );
}

export default async function AdminResolutions() {
  const supabase = await createClient();
  const [res, reopen] = await Promise.all([
    supabase.from("issue_resolutions").select("id, issue_id, resolution_summary, responsible_authority, resolution_date, issues(title), resolution_evidence(external_url, description)").eq("verification_status", "pending_verification").order("created_at"),
    supabase.from("reopen_requests").select("id, issue_id, reason, evidence_url, issues(title)").eq("status", "pending").order("created_at"),
  ]);
  const t = (rel: unknown) => ((Array.isArray(rel) ? rel[0] : rel) as { title?: string } | null)?.title ?? "Issue";
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-medium">Proposed resolutions</h2>
        {!res.data?.length ? <p className="text-sm text-muted">Nothing waiting.</p> : res.data.map((r) => (
          <article key={r.id} className="glass mb-3 rounded-2xl p-5 text-sm">
            <Link href={`/issues/${r.issue_id}`} className="font-medium text-cyan hover:underline">{t(r.issues)}</Link>
            <p className="mt-2 whitespace-pre-wrap text-muted">{r.resolution_summary}</p>
            <p className="mt-1 text-xs text-white/45">By {r.responsible_authority} · {fmtDate(r.resolution_date)}</p>
            <ul className="mt-2 space-y-1">
              {((r.resolution_evidence ?? []) as { external_url: string; description: string }[]).map((e, i) => (
                <li key={i}><a href={e.external_url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-xs text-cyan hover:underline">{e.description}</a></li>
              ))}
            </ul>
            <Review action={reviewResolution.bind(null, r.id, r.issue_id) as never} />
          </article>
        ))}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-medium">Reopen requests</h2>
        {!reopen.data?.length ? <p className="text-sm text-muted">Nothing waiting.</p> : reopen.data.map((q) => (
          <article key={q.id} className="glass mb-3 rounded-2xl p-5 text-sm">
            <Link href={`/issues/${q.issue_id}`} className="font-medium text-cyan hover:underline">{t(q.issues)}</Link>
            <p className="mt-2 whitespace-pre-wrap text-muted">{q.reason}</p>
            {q.evidence_url && <a href={q.evidence_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 block break-all text-xs text-cyan hover:underline">{q.evidence_url}</a>}
            <Review action={reviewReopen.bind(null, q.id, q.issue_id) as never} />
          </article>
        ))}
      </section>
    </div>
  );
}
