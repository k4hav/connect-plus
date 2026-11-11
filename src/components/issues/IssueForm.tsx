"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import type { ActionState } from "@/lib/action-state";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  categories: { slug: string; label: string }[];
  colleges: { id: string; college_name: string }[];
  defaults?: { title?: string; description?: string; category?: string; college_id?: string; location?: string | null };
  /** When editing, the college stays fixed. */
  editing?: boolean;
  defaultCollegeId?: string | null;
};

export function IssueForm({ action, categories, colleges, defaults, editing, defaultCollegeId }: Props) {
  return (
    <ActionForm action={action} submitLabel={editing ? "Save changes" : "Publish issue"} resetOnSuccess={false} submitClassName="w-full sm:w-auto">
      {(e) => (
        <>
          <Input name="title" label="Title" defaultValue={defaults?.title} maxLength={140} placeholder="Describe the problem in one line" error={e.title} />
          <Textarea
            name="description"
            label="Detailed description"
            rows={7}
            defaultValue={defaults?.description}
            maxLength={5000}
            hint="What is happening, since when, who is affected, and what have you already tried? Stick to facts."
            error={e.description}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectWithOther
              name="category"
              label="Category"
              defaultValue={defaults?.category ?? ""}
              placeholder="Choose a category"
              options={categories.map((c) => ({ value: c.slug, label: c.label }))}
              optionLabel="+ Other (add my own)"
              otherName="new_category"
              otherLabel="New category name"
              otherPlaceholder="e.g. Sports facilities"
              otherMaxLength={60}
              error={e.category}
            />
            {editing ? (
              <>
                <input type="hidden" name="college_id" value={defaults?.college_id} />
                <Select
                  label="College"
                  disabled
                  defaultValue={defaults?.college_id}
                  options={colleges.map((c) => ({ value: c.id, label: c.college_name }))}
                  hint="The college cannot be changed after publishing."
                />
              </>
            ) : (
              <SelectWithOther
                name="college_id"
                label="College"
                defaultValue={defaultCollegeId ?? ""}
                placeholder="Choose a college"
                options={colleges.map((c) => ({ value: c.id, label: c.college_name }))}
                optionLabel="+ My college is not listed"
                otherName="new_college"
                otherLabel="Your college name"
                otherPlaceholder="e.g. ABC Institute of Technology, Patna"
                error={e.college_id}
              />
            )}
          </div>
          <Input name="location" label="Location (optional)" defaultValue={defaults?.location ?? ""} maxLength={160} placeholder="e.g. Hostel Block C, Main Gate" error={e.location} />
          {!editing && (
            <Textarea
              name="evidence"
              label="External evidence links (optional, up to 3)"
              rows={3}
              placeholder={"https://youtube.com/watch?v=... | Video of the broken pipe\nhttps://example-news.in/story | News report"}
              hint="One per line as: link | short description. Links stay Pending until a moderator verifies them. No uploads."
              error={e.evidence}
            />
          )}
          <p className="text-xs text-white/40">
            Do not include private phone numbers, home addresses or accusations about named individuals. Moderators may hide content that harasses or doxxes people.
          </p>
        </>
      )}
    </ActionForm>
  );
}
