"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getStaffRole } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { parseForm, reopenSchema, resolutionSchema, responseSchema } from "@/lib/schemas";
import { parseHttpUrl } from "@/lib/links";

export async function recordOfficialResponse(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await getStaffRole();
  const user = await getCurrentUser();
  if (!role || !user) return fail("Only moderators can record official responses.");
  const parsed = parseForm(responseSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("official_responses").insert({
    issue_id: issueId,
    ...parsed.data,
    // A response is only "verified" when a reference link backs it; moderators can upgrade it later.
    verification_status: "pending",
    recorded_by: user.id,
  });
  if (error) return fail(dbMessage(error));
  await supabase.from("moderation_logs").insert({ moderator_id: user.id, target_type: "issue", target_id: issueId, action: "record_official_response" });
  revalidatePath(`/issues/${issueId}`);
  return done("Official response recorded.");
}

export async function setResponseVerification(responseId: string, issueId: string, status: "verified" | "unverified" | "pending"): Promise<void> {
  const role = await getStaffRole();
  if (!role) return;
  const supabase = await createClient();
  const { data: row } = await supabase.from("official_responses").select("external_reference_url").eq("id", responseId).maybeSingle();
  if (status === "verified" && !row?.external_reference_url) return; // never mark verified without a source
  await supabase.from("official_responses").update({ verification_status: status }).eq("id", responseId);
  revalidatePath(`/issues/${issueId}`);
}

export async function proposeResolution(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(resolutionSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);

  const links: { url: string; description: string }[] = [];
  for (const line of String(formData.get("links") ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [first, ...rest] = line.split("|");
    const url = parseHttpUrl(first);
    if (!url) return fail(`"${line.slice(0, 40)}" is not a valid link. Use: https://link | what it shows`, { links: "Use one link per line" });
    const d = rest.join("|").trim();
    links.push({ url, description: d.length >= 5 ? d.slice(0, 500) : "Supporting link" });
  }
  if (links.length === 0) return fail("Add at least one supporting external link.", { links: "At least one link is required" });
  if (links.length > 5) return fail("Add at most 5 links.", { links: "At most 5 links" });

  const supabase = await createClient();
  const { data: res, error } = await supabase
    .from("issue_resolutions")
    .insert({ issue_id: issueId, proposed_by: user.id, ...parsed.data })
    .select("id")
    .single();
  if (error || !res) return fail(dbMessage(error));
  const { error: evErr } = await supabase
    .from("resolution_evidence")
    .insert(links.map((l) => ({ resolution_id: res.id, external_url: l.url, description: l.description })));
  if (evErr) return fail("Proposal saved, but its links could not be stored. Please contact a moderator.");
  revalidatePath(`/issues/${issueId}`);
  return done("Proposal submitted. The issue stays unresolved until a moderator verifies it.");
}

export async function reviewResolution(resolutionId: string, issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await getStaffRole();
  if (!role) return fail("Only moderators can review resolutions.");
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_resolution", { p_resolution: resolutionId, p_approve: approve, p_note: note });
  if (error) return fail(dbMessage(error, error.message));
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/admin/resolutions");
  return done(approve ? "Resolution verified. The issue is now Resolved." : "Proposal rejected.");
}

export async function requestReopen(issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(reopenSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("reopen_requests").insert({
    issue_id: issueId,
    requested_by: user.id,
    reason: parsed.data.reason,
    evidence_url: parsed.data.evidence_url ?? null,
  });
  if (error) return fail(dbMessage(error, "Only resolved issues can be reopened."));
  revalidatePath(`/issues/${issueId}`);
  return done("Reopen request sent to the moderators.");
}

export async function reviewReopen(requestId: string, issueId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = await getStaffRole();
  if (!role) return fail("Only moderators can review reopen requests.");
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_reopen", { p_request: requestId, p_approve: approve, p_note: note });
  if (error) return fail(dbMessage(error, error.message));
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/admin/resolutions");
  return done(approve ? "Issue reopened." : "Request declined.");
}
