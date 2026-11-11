"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { saveAuthority } from "@/lib/actions/admin";

export function AuthorityForm() {
  return (
    <ActionForm action={saveAuthority} submitLabel="Add authority">
      {(e) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="authority_name" label="Name" error={e.authority_name} />
            <Input name="official_email" type="email" label="Official email" error={e.official_email} />
            <Input name="designation" label="Designation" error={e.designation} />
            <Input name="department" label="Department" error={e.department} />
            <Input name="institution" label="Institution" error={e.institution} />
            <Input name="jurisdiction" label="Jurisdiction" error={e.jurisdiction} />
          </div>
          <Input name="source_url" label="Source URL (official page listing this contact)" error={e.source_url} />
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="verified" className="accent-[#13B89A]" /> I checked the source — mark as Verified (needs source URL)</label>
        </>
      )}
    </ActionForm>
  );
}
