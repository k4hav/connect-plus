import type { SupabaseClient } from "@supabase/supabase-js";

function explain(error: { code?: string; message?: string } | null, what: string) {
  const m = error?.message ?? "";
  if (m.includes("Rate limit")) return `You added too many ${what}s today. Try tomorrow.`;
  if (error?.code === "PGRST202" || m.includes("Could not find the function")) return "Database setup is incomplete: run supabase/migrations/0003 in the Supabase SQL Editor.";
  if (m) return m.slice(0, 140);
  return `Could not add that ${what}.`;
}

/**
 * If the student chose "not listed" for college and/or category, create the entry through the
 * rate-limited database functions and write the real value back into the FormData.
 * Returns an error message, or null on success.
 */
export async function resolveNewReference(
  supabase: SupabaseClient,
  formData: FormData,
  fields: { college?: string; category?: string },
): Promise<{ field: string; message: string } | null> {
  if (fields.college && formData.get(fields.college) === "__new") {
    const name = String(formData.get("new_college") ?? "").trim();
    if (name.length < 3) return { field: fields.college, message: "Type your college name (at least 3 characters)" };
    const { data, error } = await supabase.rpc("add_college", { p_name: name });
    if (error || !data) return { field: fields.college, message: explain(error, "college") };
    formData.set(fields.college, data as string);
  }
  if (fields.category && formData.get(fields.category) === "__new") {
    const label = String(formData.get("new_category") ?? "").trim();
    if (label.length < 2) return { field: fields.category, message: "Type a category name" };
    const { data, error } = await supabase.rpc("add_category", { p_label: label });
    if (error || !data) return { field: fields.category, message: explain(error, "category") };
    formData.set(fields.category, data as string);
  }
  return null;
}
