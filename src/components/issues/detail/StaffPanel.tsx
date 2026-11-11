import { ShieldCheck } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { setIssueStatus, setIssueVisibility } from "@/lib/actions/issues";
import { ISSUE_STATUSES, STAFF_SETTABLE_STATUSES } from "@/lib/constants";

export function StaffPanel({ issueId, status, hidden }: { issueId: string; status: string; hidden: boolean }) {
  const current = (STAFF_SETTABLE_STATUSES as readonly string[]).includes(status) ? status : "";
  return (
    <section aria-labelledby="staff-h" className="rounded-2xl border border-amber/25 bg-amber/5 p-4">
      <h2 id="staff-h" className="flex items-center gap-2 text-sm font-medium text-amber">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Moderator tools
      </h2>
      <ActionForm action={setIssueStatus.bind(null, issueId)} submitLabel="Update status" submitVariant="secondary" resetOnSuccess={false} className="mt-3 space-y-2">
        <Select
          name="status"
          label="Status"
          defaultValue={current}
          placeholder={status === "resolved" || status === "reopened" ? ISSUE_STATUSES[status]?.label : undefined}
          options={STAFF_SETTABLE_STATUSES.map((s) => ({ value: s, label: ISSUE_STATUSES[s].label }))}
        />
        <Input name="note" label="Note for the moderation log" maxLength={500} />
      </ActionForm>
      <form action={setIssueVisibility.bind(null, issueId, hidden)} className="mt-3">
        <button className="text-xs text-amber hover:underline">{hidden ? "Make issue visible again" : "Hide issue from the feed"}</button>
      </form>
      <p className="mt-2 text-[11px] text-white/40">Resolved and Reopened are set only by verifying a resolution or reopen request.</p>
    </section>
  );
}
