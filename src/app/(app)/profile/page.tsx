import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getColleges } from "@/lib/data/reference";
import { fmtDate } from "@/lib/format";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, colleges] = await Promise.all([
    supabase.from("profiles").select("full_name, username, college_id, course, branch, academic_year, bio, created_at").eq("id", user.id).single(),
    getColleges(),
  ]);
  if (!profile) return <p className="text-sm text-muted">Your profile could not be loaded. Please refresh.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted">Member since {fmtDate(profile.created_at)}</p>
      </header>
      <section className="glass rounded-2xl p-5">
        <p className="text-xs text-white/40">Email</p>
        <p className="mt-0.5 text-sm">{user.email}</p>
        <p className="mt-2 text-xs text-white/35">Your email is private. It is never shown to other students.</p>
      </section>
      <section className="glass-strong rounded-2xl p-5 sm:p-6">
        <ProfileForm profile={profile} colleges={colleges} />
      </section>
    </div>
  );
}
