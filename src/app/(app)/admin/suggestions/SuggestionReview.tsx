"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { reviewSuggestion } from "@/lib/actions/admin";
import { SUGGESTION_STATUSES } from "@/lib/constants";

export function SuggestionReview({ id, status, note }: { id: string; status: string; note: string | null }) {
  return (
    <ActionForm action={reviewSuggestion.bind(null, id)} submitLabel="Save" submitVariant="secondary" resetOnSuccess={false} className="mt-3 space-y-2">
      <Select name="status" label="Status" defaultValue={status} options={Object.entries(SUGGESTION_STATUSES).map(([value, s]) => ({ value, label: s.label }))} />
      <Input name="admin_note" label="Note to the student (optional)" defaultValue={note ?? ""} maxLength={500} />
    </ActionForm>
  );
}
