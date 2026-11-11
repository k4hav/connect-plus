"use client";

import { useEffect, useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitBugReport } from "@/lib/actions/community";

export function BugForm() {
  const [browser, setBrowser] = useState("");
  useEffect(() => setBrowser(navigator.userAgent.slice(0, 300)), []);
  return (
    <ActionForm action={submitBugReport} submitLabel="Submit bug report">
      {(e) => (
        <>
          <Input name="title" label="Short title" maxLength={140} error={e.title} />
          <Textarea name="description" label="What went wrong?" rows={4} maxLength={3000} error={e.description} />
          <Textarea name="steps_to_reproduce" label="Steps to reproduce (optional)" rows={3} maxLength={2000} error={e.steps_to_reproduce} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea name="expected_behavior" label="Expected (optional)" rows={2} maxLength={1000} error={e.expected_behavior} />
            <Textarea name="actual_behavior" label="Actual (optional)" rows={2} maxLength={1000} error={e.actual_behavior} />
          </div>
          <Input name="page_url" label="Page where it happened (optional)" maxLength={500} error={e.page_url} />
          <input type="hidden" name="browser_info" value={browser} />
          <p className="text-xs text-muted">Never include passwords, tokens or other people’s private information.</p>
        </>
      )}
    </ActionForm>
  );
}
