"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addContributor } from "@/lib/actions/admin";
import { CONTRIBUTOR_ROLES } from "@/lib/constants";

export function ContributorForm() {
  return (
    <ActionForm action={addContributor} submitLabel="Add contributor">
      {(e) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="name" label="Name" error={e.name} />
            <Input name="github_username" label="GitHub username" error={e.github_username} />
          </div>
          <Select name="contribution_role" label="Role" defaultValue="frontend" options={Object.entries(CONTRIBUTOR_ROLES).map(([value, label]) => ({ value, label }))} />
          <Input name="contribution_description" label="Contribution (optional)" maxLength={400} />
        </>
      )}
    </ActionForm>
  );
}
