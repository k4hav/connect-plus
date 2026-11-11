"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getStaffRole } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { commentSchema, evidenceSchema, parseForm } from "@/lib/schemas";
import { detectPlatform } from "@/lib/links";

export async function addComment(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(commentSchema, formData);
  if (parsed.errors) return fail("Write a comment first.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("issue_comments").insert({ issue_id: issueId, user_id: user.id, comment: parsed.data.comment });
  if (error) return fail(dbMessage(error));
  revalidatePath(`/issues/${issueId}`);
  return done("Comment posted.");
}

export async function deleteOwnComment(issueId: string, commentId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("issue_comments").delete().eq("id", commentId).eq("user_id", user.id);
  revalidatePath(`/issues/${issueId}`);
}

export async function moderateComment(commentId: string, status: "visible" | "hidden" | "removed", issueId?: string): Promise<void> {
  const role = await getStaffRole();
  const user = await getCurrentUser();
  if (!role || !user) return;
  const supabase = await createClient();
  const { error } = await supabase.from("issue_comments").update({ moderation_status: status }).eq("id", commentId);
  if (!error) {
    await supabase.from("moderation_logs").insert({ moderator_id: user.id, target_type: "comment", target_id: commentId, action: `comment_${status}` });
  }
  revalidatePath("/admin/comments");
  if (issueId) revalidatePath(`/issues/${issueId}`);
}

export async function addEvidence(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(evidenceSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("issue_evidence").insert({
    issue_id: issueId,
    submitted_by: user.id,
    external_url: parsed.data.external_url,
    platform: detectPlatform(parsed.data.external_url),
    description: parsed.data.description,
  });
  if (error) return fail(dbMessage(error));
  revalidatePath(`/issues/${issueId}`);
  return done("Link submitted. It stays Pending until a moderator verifies it.");
}

export async function verifyEvidence(evidenceId: string, issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await getStaffRole();
  const user = await getCurrentUser();
  if (!role || !user) return fail("Only moderators can verify evidence.");
  const status = String(formData.get("status") ?? "");
  if (!["pending", "verified", "unverified", "link_unavailable"].includes(status)) return fail("Choose a status.");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  const { error } = await supabase
    .from("issue_evidence")
    .update({
      verification_status: status,
      moderator_note: note,
      verified_at: status === "pending" ? null : new Date().toISOString(),
      verified_by: status === "pending" ? null : user.id,
    })
    .eq("id", evidenceId);
  if (error) return fail(dbMessage(error));
  await supabase.from("moderation_logs").insert({ moderator_id: user.id, target_type: "evidence", target_id: evidenceId, action: `evidence_${status}`, reason: note });
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/admin/evidence");
  return done("Evidence updated.");
}
