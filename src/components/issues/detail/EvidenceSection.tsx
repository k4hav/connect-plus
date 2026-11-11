import { ExternalLink } from "lucide-react";
import { MappedBadge, Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addEvidence, verifyEvidence } from "@/lib/actions/discussion";
import { EVIDENCE_STATUSES } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/links";
import { fmtDate } from "@/lib/format";
import { ReportContent } from "./ReportContent";

type Evidence = {
  id: string;
  external_url: string;
  platform: string;
  description: string;
  verification_status: string;
  moderator_note: string | null;
  submitted_at: string;
  verified_at: string | null;
};

export function EvidenceSection({ issueId, evidence, isStaff }: { issueId: string; evidence: Evidence[]; isStaff: boolean }) {
  return (
    <section aria-labelledby="evidence-h" className="glass rounded-2xl p-5">
      <h2 id="evidence-h" className="text-lg font-medium">External evidence</h2>
      <p className="mt-1 text-xs text-muted">Links only; nothing is uploaded or re-hosted. A submitted link is not verified until a moderator reviews it.</p>

      {evidence.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No evidence links yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {evidence.map((e) => (
            <li key={e.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{PLATFORM_LABELS[e.platform] ?? "Link"}</Badge>
                <MappedBadge map={EVIDENCE_STATUSES} value={e.verification_status} />
                <span className="text-xs text-white/40">Submitted {fmtDate(e.submitted_at)}</span>
              </div>
              <p className="mt-2 text-sm">{e.description}</p>
              <a
                href={e.external_url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-xs text-cyan hover:underline"
              >
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /> {e.external_url}
              </a>
              {e.moderator_note && (
                <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted">
                  <span className="font-medium text-ink">Moderator note:</span> {e.moderator_note}
                  {e.verified_at && ` (${fmtDate(e.verified_at)})`}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-start gap-4">
                <ReportContent type="evidence" id={e.id} issueId={issueId} />
                {isStaff && (
                  <details className="text-xs">
                    <summary className="cursor-pointer list-none text-amber hover:underline">Verify</summary>
                    <ActionForm action={verifyEvidence.bind(null, e.id, issueId)} submitLabel="Save" submitVariant="secondary" resetOnSuccess={false} className="mt-2 flex max-w-sm flex-col gap-2">
                      <Select name="status" defaultValue={e.verification_status} options={Object.entries(EVIDENCE_STATUSES).map(([value, s]) => ({ value, label: s.label }))} />
                      <Input name="note" label="Moderator note" defaultValue={e.moderator_note ?? ""} maxLength={500} />
                    </ActionForm>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer list-none text-sm font-medium text-cyan hover:underline">+ Add an evidence link</summary>
        <ActionForm action={addEvidence.bind(null, issueId)} submitLabel="Submit link" className="mt-3 space-y-3">
          <>
              <Input name="external_url" type="url" label="Link (YouTube, Instagram, X, news, official site...)" placeholder="https://" />
              <Input name="description" label="What does this show?" maxLength={500} />
            </>
        </ActionForm>
      </details>
    </section>
  );
}