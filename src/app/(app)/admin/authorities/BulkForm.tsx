"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Textarea } from "@/components/ui/textarea";
import { bulkAddAuthorities } from "@/lib/actions/admin";

export function BulkForm() {
  return (
    <ActionForm action={bulkAddAuthorities} submitLabel="Import">
      <Textarea
        name="lines"
        label="One authority per line"
        rows={8}
        placeholder={"Registrar | Registrar | Administration | Bihar Engineering University | registrar@example.ac.in | https://official-page-with-this-email"}
        hint="name | designation | department | institution | email | source URL.  Lines starting with # are ignored. Max 100."
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="verified" className="accent-[#13B89A]" /> I checked every source URL: mark all as Verified
      </label>
    </ActionForm>
  );
}
