import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Start a campaign" };

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ issue?: string }> }) {
  const { issue: issueId } = await searchParams;
  if (!issueId || !/^[0-9a-f-]{36}$/i.test(issueId)) notFound();
  await requireUser();
  const supabase = await createClient();
  const { data: issue } = await supabase.from("issues").select("id, title").eq("id", issueId).maybeSingle();
  if (!issue) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Start a campaign</h1>
        <p className="mt-1 text-sm text-muted">
          For issue: <Link href={`/issues/${issue.id}`} className="text-cyan hover:underline">{issue.title}</Link>
        </p>
      </header>
      <div className="glass-strong rounded-2xl p-5 sm:p-6">
        <CampaignForm issueId={issue.id} />
      </div>
    </div>
  );
}
