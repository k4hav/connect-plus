import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge, MappedBadge } from "@/components/ui/badge";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  proposeResolution,
  recordOfficialResponse,
  requestReopen,
  reviewReopen,
  reviewResolution,
  setResponseVerification,
} from "@/lib/actions/accountability";
import { RESOLUTION_STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

type Response = {
  id: string;
  authority_name: string;
  response_summary: string;
  response_date: string;
  external_reference_url: string | null;
  verification_status: string;
};
type Resolution = {
  id: string;
  resolution_summary: string;
  responsible_authority: string;
  resolution_date: string;
  verification_status: string;
  review_note: string | null;
  verified_at: string | null;
  created_at: string;
  resolution_evidence: { id: string; external_url: string; description: string }[];
};
type Reopen = { id: string; reason: string; evidence_url: string | null; status: string; review_note: string | null; created_at: string };

type Props = {
  issueId: string;
  issueStatus: string;
  responses: Response[];
  resolutions: Resolution[];
  reopenRequests: Reopen[];
  isStaff: boolean;
};

const dt = (iso: string) => fmtDate(iso);

export function AccountabilitySection({ issueId, issueStatus, responses, resolutions, reopenRequests, isStaff }: Props) {
  const resolved = issueStatus === "resolved";
  const hasPending = resolutions.some((r) => r.verification_status === "pending_verification");

  return (
    <>
      <section aria-labelledby="resp-h" className="glass rounded-2xl p-5">
        <h2 id="resp-h" className="text-lg font-medium">Official responses</h2>
        <p className="mt-1 text-xs text-muted">Recorded by moderators. A response is labelled Verified only when a reference link backs it.</p>
        {responses.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No official response has been recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {responses.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{r.authority_name}</span>
                  <Badge tone={r.verification_status === "verified" ? "green" : r.verification_status === "unverified" ? "neutral" : "amber"}>
                    {r.verification_status === "verified" ? "Verified" : r.verification_status === "unverified" ? "Unverified" : "Pending"}
                  </Badge>
                  <span className="text-xs text-white/40">{dt(r.response_date)}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{r.response_summary}</p>
                {r.external_reference_url && (
                  <a href={r.external_reference_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-flex items-center gap-1 break-all text-xs text-cyan hover:underline">
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /> Reference
                  </a>
                )}
                {isStaff && r.external_reference_url && r.verification_status !== "verified" && (
                  <form action={setResponseVerification.bind(null, r.id, issueId, "verified")} className="mt-2">
                    <button className="text-xs text-amber hover:underline">Mark verified (source checked)</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {isStaff && (
          <details className="mt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-amber hover:underline">+ Record an official response</summary>
            <ActionForm action={recordOfficialResponse.bind(null, issueId)} submitLabel="Record response" className="mt-3 space-y-3">
              <>
                  <Input name="authority_name" label="Authority" />
                  <Textarea name="response_summary" label="Response summary" rows={3} maxLength={3000} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="response_date" type="date" label="Response date" />
                    <Input name="external_reference_url" type="url" label="Reference link (optional)" placeholder="https://" />
                  </div>
                </>
            </ActionForm>
          </details>
        )}
      </section>

      <section aria-labelledby="res-h" className="glass rounded-2xl p-5">
        <h2 id="res-h" className="flex items-center gap-2 text-lg font-medium">
          <ShieldCheck className="h-5 w-5 text-emerald" aria-hidden="true" /> Resolution
        </h2>
        <p className="mt-1 text-xs text-muted">
          An issue is never resolved because someone says so. A moderator must verify the evidence first, and every proposal stays on record.
        </p>

        {resolutions.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No resolution has been proposed.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resolutions.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <MappedBadge map={RESOLUTION_STATUSES} value={r.verification_status} />
                  <span className="text-xs text-white/40">
                    {r.responsible_authority} · {dt(r.resolution_date)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{r.resolution_summary}</p>
                {r.resolution_evidence.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {r.resolution_evidence.map((ev) => (
                      <li key={ev.id} className="text-xs">
                        <a href={ev.external_url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex items-center gap-1 break-all text-cyan hover:underline">
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" /> {ev.description}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {r.review_note && <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted">Moderator note: {r.review_note}</p>}
                {isStaff && r.verification_status === "pending_verification" && (
                  <ActionForm action={reviewResolution.bind(null, r.id, issueId)} hideSubmit resetOnSuccess={false} className="mt-3 space-y-2 border-t border-white/5 pt-3">
                    <Input name="note" label="Review note (shown publicly)" maxLength={500} />
                    <div className="flex gap-2">
                      <SubmitButton name="decision" value="approve" variant="primary" size="sm">Verify &amp; mark resolved</SubmitButton>
                      <SubmitButton name="decision" value="reject" variant="danger" size="sm">Reject</SubmitButton>
                    </div>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        )}

        {!resolved && !hasPending && (
          <details className="mt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-cyan hover:underline">+ Propose a resolution</summary>
            <ActionForm action={proposeResolution.bind(null, issueId)} submitLabel="Submit for verification" className="mt-3 space-y-3">
              <>
                  <Textarea name="resolution_summary" label="What was done?" rows={3} maxLength={3000} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input name="responsible_authority" label="Responsible authority" />
                    <Input name="resolution_date" type="date" label="Date it was fixed" />
                  </div>
                  <Textarea
                    name="links"
                    label="Supporting links (required)"
                    rows={3}
                    placeholder={"https://... | Photo post showing the repair"}
                    hint="One per line: link | description"
                  />
                </>
            </ActionForm>
          </details>
        )}

        {resolved && (
          <details className="mt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-amber hover:underline">Problem is back? Request reopening</summary>
            <ActionForm action={requestReopen.bind(null, issueId)} submitLabel="Request reopen" className="mt-3 space-y-3">
              <>
                  <Textarea name="reason" label="Why should it be reopened?" rows={3} maxLength={1500} />
                  <Input name="evidence_url" type="url" label="Evidence link (optional)" placeholder="https://" />
                </>
            </ActionForm>
          </details>
        )}

        {reopenRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium">Reopen requests</h3>
            {reopenRequests.map((q) => (
              <div key={q.id} className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge tone={q.status === "approved" ? "green" : q.status === "rejected" ? "red" : "amber"}>{q.status}</Badge>
                  <span className="text-xs text-white/40">{dt(q.created_at)}</span>
                </div>
                <p className="mt-1.5 text-muted">{q.reason}</p>
                {q.evidence_url && (
                  <a href={q.evidence_url} target="_blank" rel="noopener noreferrer nofollow ugc" className="mt-1 inline-flex items-center gap-1 break-all text-xs text-cyan hover:underline">
                    <ExternalLink className="h-3 w-3" aria-hidden="true" /> Evidence
                  </a>
                )}
                {q.review_note && <p className="mt-1.5 text-xs text-muted">Moderator note: {q.review_note}</p>}
                {isStaff && q.status === "pending" && (
                  <ActionForm action={reviewReopen.bind(null, q.id, issueId)} hideSubmit resetOnSuccess={false} className="mt-2 space-y-2">
                    <Input name="note" label="Review note" maxLength={500} />
                    <div className="flex gap-2">
                      <SubmitButton name="decision" value="approve" size="sm">Approve reopening</SubmitButton>
                      <SubmitButton name="decision" value="reject" variant="secondary" size="sm">Decline</SubmitButton>
                    </div>
                  </ActionForm>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}