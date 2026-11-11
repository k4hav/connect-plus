"use client";

import { Flag } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Textarea } from "@/components/ui/textarea";
import { reportContent } from "@/lib/actions/issues";

/** Lightweight "report" disclosure for issues, comments and evidence. */
export function ReportContent({ type, id, issueId }: { type: "issue" | "comment" | "evidence" | "campaign"; id: string; issueId?: string }) {
  return (
    <details className="group text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-white/35 hover:text-white/70">
        <Flag className="h-3 w-3" aria-hidden="true" /> Report
      </summary>
      <div className="mt-2 max-w-sm rounded-xl border border-white/10 bg-black/20 p-3">
        <ActionForm action={reportContent.bind(null, { type, id, issueId })} submitLabel="Send report" submitVariant="secondary" className="space-y-2">
          {(e) => <Textarea name="reason" label="What is wrong? (harassment, spam, personal info, false claim)" rows={2} maxLength={1000} error={e.reason} />}
        </ActionForm>
      </div>
    </details>
  );
}
