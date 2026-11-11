import type { Metadata } from "next";
import { IssueForm } from "@/components/issues/IssueForm";
import { createIssue } from "@/lib/actions/issues";
import { getCategories, getColleges } from "@/lib/data/reference";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Raise an Issue" };

export default async function NewIssuePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [categories, colleges, profile] = await Promise.all([
    getCategories(),
    getColleges(),
    supabase.from("profiles").select("college_id").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Raise an Issue</h1>
        <p className="mt-1 text-sm text-muted">Clear, factual issues get support and responses faster.</p>
      </header>
      <div className="glass-strong rounded-2xl p-5 sm:p-6">
        <IssueForm
          action={createIssue}
          categories={categories.filter((c) => c.is_active)}
          colleges={colleges}
          defaultCollegeId={profile.data?.college_id}
        />
      </div>
    </div>
  );
}
