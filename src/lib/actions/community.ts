"use server";

import { revalidatePath } from "next/cache";
import { resolveNewReference } from "@/lib/data/new-reference";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { emailDraftSchema, parseForm, reportSchema, suggestionSchema } from "@/lib/schemas";
import { fieldErrors, profileSchema } from "@/lib/validation";

// Never store credentials by accident: reject obvious secrets in free-text bug reports.
const SECRET_PATTERN = /(password\s*[:=]|passwd\s*[:=]|eyJ[A-Za-z0-9_-]{20,}|sb_secret_|service_role|refresh[_ ]token\s*[:=])/i;

export async function submitBugReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(reportSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const all = Object.values(parsed.data).filter(Boolean).join("\n");
  if (SECRET_PATTERN.test(all)) {
    return fail("This looks like it contains a password or token. Remove it and try again.");
  }
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({ ...parsed.data, user_id: user?.id ?? null, report_type: "bug" });
  if (error) return fail(dbMessage(error));
  return done("Bug report saved on Connect⁺. Thank you. It has not been sent to GitHub.");
}

export async function submitSuggestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(suggestionSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("suggestions").insert({ ...parsed.data, user_id: user.id });
  if (error) return fail(dbMessage(error));
  revalidatePath("/feedback");
  return done("Suggestion submitted. You can follow its status below.");
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("You need to sign in again.");
  const supabase = await createClient();
  const extra = await resolveNewReference(supabase, formData, { college: "college_id" });
  if (extra) return fail("Please fix the highlighted fields.", { [extra.field]: extra.message });
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username") ?? "",
    college_id: formData.get("college_id") ?? "",
    course: formData.get("course") ?? "",
    branch: formData.get("branch") ?? "",
    academic_year: formData.get("academic_year") ?? "",
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) return fail("Please fix the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      username: v.username || null,
      college_id: v.college_id || null,
      course: v.course || null,
      branch: v.branch || null,
      academic_year: v.academic_year ?? null,
      bio: v.bio || null,
    })
    .eq("id", user.id);
  if (error) return fail(error.code === "23505" ? "That username is taken." : "Could not save your profile. Please try again.", error.code === "23505" ? { username: "Already taken" } : undefined);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return done("Profile saved.");
}

/** Saves a draft of the student's pasted email plus their selected authorities. Nothing is sent. */
export async function saveEmailDraft(issueId: string, authorityIds: string[], _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(emailDraftSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  if (authorityIds.length === 0) return fail("Select at least one authority.");
  const supabase = await createClient();
  const { error } = await supabase.from("email_campaigns").insert({ issue_id: issueId, created_by: user.id, ...parsed.data, status: "draft" });
  if (error) return fail(dbMessage(error));
  await supabase
    .from("issue_recipients")
    .upsert(authorityIds.map((authority_id) => ({ issue_id: issueId, authority_id, selected_by: user.id })), { onConflict: "issue_id,authority_id,selected_by", ignoreDuplicates: true });
  return done("Draft saved. Nothing has been sent. Gmail sending arrives once your Google account is connected.");
}
