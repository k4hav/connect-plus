"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCampaign } from "@/lib/actions/campaigns";

export function CampaignForm({ issueId }: { issueId: string }) {
  return (
    <ActionForm action={createCampaign} submitLabel="Start campaign" resetOnSuccess={false}>
      {(e) => (
        <>
          <input type="hidden" name="issue_id" value={issueId} />
          <Input name="title" label="Campaign title" maxLength={120} error={e.title} />
          <Textarea name="description" label="What are you organizing, and what outcome do you want?" rows={5} maxLength={3000} error={e.description} />
          <Textarea
            name="links"
            label="Related external links (optional, up to 5)"
            rows={3}
            placeholder={"https://... | Petition page"}
            hint="One per line: link | label"
            error={e.links}
          />
        </>
      )}
    </ActionForm>
  );
}
