"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { dbMessage, done, fail, type ActionState } from "@/lib/action-state";
import { campaignSchema, campaignUpdateSchema, parseForm } from "@/lib/schemas";
import { parseHttpUrl } from "@/lib/links";

export async function createCampaign(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(campaignSchema, formData);
  if (parsed.errors) return fail("Please fix the highlighted fields.", parsed.errors);

  const links: { url: string; label: string }[] = [];
  for (const line of String(formData.get("links") ?? "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [first, ...rest] = line.split("|");
    const url = parseHttpUrl(first);
    if (!url) return fail(`"${line.slice(0, 40)}" is not a valid link.`, { links: "Use: https://link | label" });
    links.push({ url, label: rest.join("|").trim().slice(0, 80) || "Related link" });
  }
  if (links.length > 5) return fail("Add at most 5 links.", { links: "At most 5 links" });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...parsed.data, created_by: user.id, external_links: links })
    .select("id")
    .single();
  if (error || !data) return fail(dbMessage(error));
  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}`);
}

export async function toggleCampaignSupport(campaignId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("campaign_supporters").select("id").eq("campaign_id", campaignId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("campaign_supporters").delete().eq("id", existing.id);
  else await supabase.from("campaign_supporters").insert({ campaign_id: campaignId, user_id: user.id });
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
}

export async function postCampaignUpdate(campaignId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.");
  const parsed = parseForm(campaignUpdateSchema, formData);
  if (parsed.errors) return fail("Write an update first.", parsed.errors);
  const supabase = await createClient();
  const { error } = await supabase.from("campaign_updates").insert({ campaign_id: campaignId, author_id: user.id, body: parsed.data.body });
  if (error) return fail(dbMessage(error, "Only the campaign creator can post updates."));
  revalidatePath(`/campaigns/${campaignId}`);
  return done("Update posted.");
}

export async function setCampaignStatus(campaignId: string, status: "active" | "paused" | "completed" | "closed"): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("campaigns").update({ status }).eq("id", campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
}
