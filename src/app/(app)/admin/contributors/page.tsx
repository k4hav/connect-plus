import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { setContributorStatus } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ContributorForm } from "./ContributorForm";

export const metadata: Metadata = { title: "Admin · Contributors" };

export default async function AdminContributors() {
  await requireStaff("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("contributors").select("id, name, github_username, contribution_role, approval_status").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-2xl p-5"><h2 className="mb-3 font-medium">Add contributor</h2><ContributorForm /></section>
      <ul className="space-y-2">
        {(data ?? []).map((c) => (
          <li key={c.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm">
            <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted">{c.contribution_role}{c.github_username ? ` · @${c.github_username}` : ""}</p></div>
            <div className="flex items-center gap-2">
              <Badge tone={c.approval_status === "approved" ? "green" : c.approval_status === "rejected" ? "red" : "amber"}>{c.approval_status}</Badge>
              {(["approved", "rejected"] as const).map((s) => (
                <form key={s} action={setContributorStatus.bind(null, c.id, s)}><button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">{s === "approved" ? "Approve" : "Reject"}</button></form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
