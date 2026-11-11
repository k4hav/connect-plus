"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveNewReference } from "@/lib/data/new-reference";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getStaffRole } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { abuseReportSchema, issueSchema, parseForm } from "@/lib/schemas";
import { detectPlatform, parseHttpUrl } from "@/lib/links";
import { STAFF_SETTABLE_STATUSES } from "@/lib/constants";

/** Up to 3 "url | description" lines from the evidence textarea. */
function parseEvidenceLines(raw: string): { url: string; description: string }[] | { error: string } {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 3) return { error: "Add at most 3 evidence links when raising an issue" };
  const out: { url: string; description: string }[] = [];
  for (const line of lines) {
    const [first, ...rest] = line.split("|");
    const url = parseHttpUrl(first);
    if (!url) return { error: `"${line.slice(0, 40)}" is not a valid link. Use: https://link | what it shows` };
    const description = rest.join("|").trim() || "Supporting link";
    out.push({ url, description: description.length >= 5 ? description.slice(0, 500) : "Supporting link" });
  }
  return out;
}

export async function createIssue(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");

  const supabase = await createClient();
  const extra = await resolveNewReference(supabase, formData, { college: "college_id", category: "category" });
  if (extra) return fail("Please fix the highlighted fields.", { [extra.field]: extra.message });

  const parsed = parseForm(issueSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);

  const evidence = parseEvidenceLines(String(formData.get("evidence") ?? ""));
  if ("error" in evidence) return fail(evidence.error, { evidence: evidence.error });

  const { data: issue, error } = await supabase
    .from("issues")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error || !issue) {
    console.error("createIssue failed:", error?.code, error?.message, error?.details);
    const constraint = error?.message?.match(/constraint "([^"]+)"/)?.[1];
    const hint = error?.code ? ` (error code ${error.code}${constraint ? `, ${constraint}` : ""})` : "";
    return fail(dbMessage(error, `Could not publish your issue. Please try again.${hint}`));
  }

  if (evidence.length) {
    await supabase.from("issue_evidence").insert(
      evidence.map((e) => ({
        issue_id: issue.id,
        submitted_by: user.id,
        external_url: e.url,
        platform: detectPlatform(e.url),
        description: e.description,
      })),
    );
  }
  revalidatePath("/issues");
  revalidatePath("/dashboard");
  redirect(`/issues/${issue.id}`);
}

export async function updateIssue(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const supabase = await createClient();
  const extra = await resolveNewReference(supabase, formData, { category: "category" });
  if (extra) return fail("Please fix the highlighted fields.", { [extra.field]: extra.message });
  const parsed = parseForm(issueSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);

  const { college_id: _college, ...editable } = parsed.data; // college is fixed after publishing
  const { data, error } = await supabase.from("issues").update(editable).eq("id", issueId).select("id");
  if (error) return fail(dbMessage(error));
  if (!data?.length) return fail("You can only edit issues you created.");
  revalidatePath(`/issues/${issueId}`);
  redirect(`/issues/${issueId}`);
}

export async function toggleSupport(issueId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("issue_likes").select("id").eq("issue_id", issueId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("issue_likes").delete().eq("id", existing.id);
  else await supabase.from("issue_likes").insert({ issue_id: issueId, user_id: user.id });
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/issues");
  revalidatePath("/dashboard");
}

export async function toggleFollow(issueId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("issue_follows").select("id").eq("issue_id", issueId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("issue_follows").delete().eq("id", existing.id);
  else await supabase.from("issue_follows").insert({ issue_id: issueId, user_id: user.id });
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/followed");
}

export async function setIssueStatus(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await getStaffRole();
  const user = await getCurrentUser();
  if (!role || !user) return fail("Only moderators can change an issue's status.");
  const status = String(formData.get("status") ?? "");
  if (!(STAFF_SETTABLE_STATUSES as readonly string[]).includes(status)) {
    return fail("Resolved and Reopened are only set through the verification workflow below.");
  }
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  const { error } = await supabase.from("issues").update({ status }).eq("id", issueId);
  if (error) return fail(dbMessage(error));
  await supabase.from("moderation_logs").insert({ moderator_id: user.id, target_type: "issue", target_id: issueId, action: `set_status:${status}`, reason: note });
  revalidatePath(`/issues/${issueId}`);
  return done("Status updated.");
}

export async function setIssueVisibility(issueId: string, visible: boolean, formData?: FormData): Promise<void> {
  const role = await getStaffRole();
  const user = await getCurrentUser();
  if (!role || !user) return;
  const supabase = await createClient();
  const { error } = await supabase.from("issues").update({ moderation_status: visible ? "visible" : "hidden" }).eq("id", issueId);
  if (!error) {
    await supabase.from("moderation_logs").insert({
      moderator_id: user.id,
      target_type: "issue",
      target_id: issueId,
      action: visible ? "unhide_issue" : "hide_issue",
      reason: String(formData?.get("reason") ?? "").slice(0, 500) || null,
    });
  }
  revalidatePath("/admin/issues");
  revalidatePath(`/issues/${issueId}`);
}

/** Student-facing report of an issue/comment/evidence for moderator review. */
export async function reportContent(
  target: { type: "issue" | "comment" | "evidence" | "campaign"; id: string; issueId?: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to report content.");
  const parsed = parseForm(abuseReportSchema, formData);
  if (parsed.errors) return fail("Please add a short reason.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    user_id: user.id,
    report_type: "abuse",
    target_type: target.type,
    target_id: target.id,
    title: `Reported ${target.type}`,
    description: parsed.data.reason,
    page_url: target.issueId ? `/issues/${target.issueId}` : null,
  });
  if (error) return fail(dbMessage(error));
  return done("Thanks. A moderator will review this report.");
}
