import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { IssueForm } from "@/components/issues/IssueForm";
import { updateIssue } from "@/lib/actions/issues";
import { getCategories, getColleges } from "@/lib/data/reference";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit issue" };

export default async function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: issue } = await supabase.from("issues").select("id, title, description, category, college_id, location, created_by").eq("id", id).maybeSingle();
  if (!issue) notFound();
  if (issue.created_by !== user.id) redirect(`/issues/${id}`);
  const [categories, colleges] = await Promise.all([getCategories(), getColleges()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit issue</h1>
      <p className="text-sm text-muted">Edits are recorded in the issue history.</p>
      <div className="glass-strong rounded-2xl p-5 sm:p-6">
        <IssueForm action={updateIssue.bind(null, id)} categories={categories} colleges={colleges} defaults={issue} editing />
      </div>
    </div>
  );
}
