"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitSuggestion } from "@/lib/actions/community";
import { SUGGESTION_CATEGORIES } from "@/lib/constants";

export function SuggestionForm() {
  return (
    <ActionForm action={submitSuggestion} submitLabel="Submit suggestion">
      {(e) => (
        <>
          <Input name="title" label="Title" maxLength={140} error={e.title} />
          <Select name="category" label="Category" defaultValue="general" options={Object.entries(SUGGESTION_CATEGORIES).map(([value, label]) => ({ value, label }))} error={e.category} />
          <Textarea name="description" label="Describe your idea" rows={5} maxLength={3000} error={e.description} />
          <Input name="related_page" label="Related page (optional)" maxLength={200} placeholder="/issues" error={e.related_page} />
        </>
      )}
    </ActionForm>
  );
}
