import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EmailWorkflow } from "@/components/issues/EmailWorkflow";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildDemandPrompt } from "@/lib/demand";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Email authorities" };

export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requireUser();
  const supabase = await createClient();
  const { data: issue } = await supabase.from("issue_feed").select("*").eq("id", id).maybeSingle();
  if (!issue) notFound();
  const [evidence, authorities] = await Promise.all([
    supabase.from("issue_evidence").select("external_url, description, verification_status").eq("issue_id", id),
    supabase
      .from("authority_directory")
      .select("id, authority_name, designation, department, official_email, institution, verification_status")
      .eq("is_active", true)
      .order("verification_status", { ascending: false })
      .order("authority_name")
      .limit(300),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/issues/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to issue
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Email authorities</h1>
        <p className="mt-1 text-sm text-muted">{issue.title}</p>
      </header>
      <EmailWorkflow issueId={id} demand={buildDemandPrompt(issue, evidence.data ?? [], SITE_URL)} authorities={authorities.data ?? []} />
    </div>
  );
}
