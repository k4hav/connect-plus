"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffRole } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { authoritySchema, parseForm } from "@/lib/schemas";

async function adminOnly() {
  return (await getStaffRole()) === "admin";
}

async function log(target_type: string, target_id: string | null, action: string, reason?: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  await supabase.from("moderation_logs").insert({ moderator_id: data.user?.id ?? null, target_type, target_id, action, reason: reason ?? null });
}

export async function saveAuthority(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await adminOnly())) return fail("Only administrators can manage the directory.");
  const parsed = parseForm(authoritySchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);
  const verify = formData.get("verified") === "on";
  const v = parsed.data;
  if (verify && !v.source_url) return fail("A verified authority needs a source URL.", { source_url: "Required to verify" });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("authority_directory")
    .insert({ ...v, created_by: auth.user?.id, verification_status: verify ? "verified" : "unverified", last_verified_at: verify ? new Date().toISOString() : null })
    .select("id")
    .single();
  if (error) return fail(dbMessage(error));
  await log("authority", data.id, "create_authority");
  revalidatePath("/admin/authorities");
  revalidatePath("/authorities");
  return done("Authority added.");
}

export async function setAuthorityActive(id: string, active: boolean): Promise<void> {
  if (!(await adminOnly())) return;
  const supabase = await createClient();
  await supabase.from("authority_directory").update({ is_active: active }).eq("id", id);
  await log("authority", id, active ? "activate_authority" : "deactivate_authority");
  revalidatePath("/admin/authorities");
  revalidatePath("/authorities");
}

export async function addContributor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await adminOnly())) return fail("Only administrators can manage contributors.");
  const name = String(formData.get("name") ?? "").trim();
  const gh = String(formData.get("github_username") ?? "").trim();
  const role = String(formData.get("contribution_role") ?? "");
  const desc = String(formData.get("contribution_description") ?? "").trim().slice(0, 400);
  if (name.length < 2) return fail("Enter a name.", { name: "Required" });
  if (gh && !/^[A-Za-z0-9-]{1,39}$/.test(gh)) return fail("Invalid GitHub username.", { github_username: "Invalid" });
  const supabase = await createClient();
  const { error } = await supabase.from("contributors").insert({
    name,
    github_username: gh || null,
    github_profile_url: gh ? `https://github.com/${gh}` : null,
    contribution_role: role,
    contribution_description: desc || null,
    approval_status: "pending",
  });
  if (error) return fail(dbMessage(error));
  revalidatePath("/admin/contributors");
  return done("Contributor added as pending. Approve to show it publicly.");
}

export async function setContributorStatus(id: string, status: "approved" | "rejected" | "pending"): Promise<void> {
  if (!(await adminOnly())) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  await supabase.from("contributors").update({ approval_status: status, approved_by: status === "approved" ? data.user?.id : null }).eq("id", id);
  await log("contributor", id, `contributor_${status}`);
  revalidatePath("/admin/contributors");
  revalidatePath("/contributors");
}

export async function reviewSuggestion(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await adminOnly())) return fail("Only administrators can review suggestions.");
  const status = String(formData.get("status"));
  if (!["pending", "under_review", "accepted", "planned", "implemented", "declined"].includes(status)) return fail("Invalid status.");
  const note = String(formData.get("admin_note") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  const { error } = await supabase.from("suggestions").update({ status, admin_note: note }).eq("id", id);
  if (error) return fail(dbMessage(error));
  revalidatePath("/admin/suggestions");
  return done("Saved.");
}

export async function setReportStatus(id: string, status: "open" | "in_review" | "resolved" | "dismissed"): Promise<void> {
  if (!(await getStaffRole())) return;
  const supabase = await createClient();
  await supabase.from("reports").update({ status }).eq("id", id);
  await log("report", id, `report_${status}`);
  revalidatePath("/admin/reports");
}

/**
 * Bulk import: one authority per line, fields separated by "|":
 * name | designation | department | institution | email | source URL
 */
export async function bulkAddAuthorities(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await adminOnly())) return fail("Only administrators can manage the directory.");
  const raw = String(formData.get("lines") ?? "");
  const markVerified = formData.get("verified") === "on";
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (!lines.length) return fail("Paste at least one line.", { lines: "Nothing to import" });
  if (lines.length > 100) return fail("Import at most 100 lines at a time.", { lines: "Too many lines" });

  const rows: Record<string, unknown>[] = [];
  const problems: string[] = [];
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  lines.forEach((line, i) => {
    const [name, designation, department, institution, email, source] = line.split("|").map((p) => p.trim());
    const parsed = authoritySchema.safeParse({ authority_name: name, designation, department, institution, official_email: email, source_url: source });
    if (!parsed.success) return problems.push(`Line ${i + 1}: ${parsed.error.issues[0].message}`);
    if (markVerified && !parsed.data.source_url) return problems.push(`Line ${i + 1}: verified needs a source URL`);
    rows.push({
      ...parsed.data,
      created_by: auth.user?.id,
      verification_status: markVerified ? "verified" : "unverified",
      last_verified_at: markVerified ? new Date().toISOString() : null,
    });
  });
  if (problems.length) return fail(problems.slice(0, 5).join(" · "), { lines: `${problems.length} line(s) need fixing` });

  const { error } = await supabase.from("authority_directory").insert(rows);
  if (error) return fail(dbMessage(error));
  await log("authority", null, "bulk_import_authorities", `${rows.length} rows`);
  revalidatePath("/admin/authorities");
  revalidatePath("/authorities");
  return done(`${rows.length} authorities added.`);
}