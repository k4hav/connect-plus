import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "moderator" | "admin";

/** Validated with Supabase Auth (never trusts the cookie alone). Deduped per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getStaffRole = cache(async (): Promise<StaffRole | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("admin_roles").select("role").eq("user_id", user.id).maybeSingle();
  return (data?.role as StaffRole | undefined) ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Server-side gate for admin pages. RLS and DB triggers enforce the same rules again. */
export async function requireStaff(min: StaffRole = "moderator") {
  const user = await requireUser();
  const role = await getStaffRole();
  if (!role || (min === "admin" && role !== "admin")) redirect("/dashboard");
  return { user, role };
}
