import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { CONTRIBUTOR_ROLES } from "@/lib/constants";
import { parseHttpUrl } from "@/lib/links";
import { GITHUB_REPO_URL } from "@/lib/utils";
import { ContributeGuide } from "@/components/community/ContributeGuide";

export const metadata: Metadata = { title: "Contributors" };

export default async function ContributorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contributors")
    .select("id, name, github_username, github_profile_url, contribution_role, contribution_description")
    .eq("approval_status", "approved")
    .order("created_at");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Contributors</h1>
        <p className="mt-1 text-sm text-muted">Connect⁺ is growing. Built with a vision by Keshav Sharma. Contributions are welcome.</p>
      </header>
      {!data?.length ? (
        <EmptyState icon={Users} title="Contributors will appear here" action={GITHUB_REPO_URL ? <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-xl bg-cyan px-4 text-sm font-medium text-[#04121b] hover:bg-bright">Contribute on GitHub</a> : undefined}>
          Approved contributors are listed by an administrator. Nobody is shown here until approved.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const href = parseHttpUrl(c.github_profile_url);
            return (
              <article key={c.id} className="glass rounded-2xl p-5">
                <h2 className="font-medium">{c.name}</h2>
                <Badge tone="cyan" className="mt-1">{CONTRIBUTOR_ROLES[c.contribution_role] ?? c.contribution_role}</Badge>
                {c.contribution_description && <p className="mt-3 text-sm text-muted">{c.contribution_description}</p>}
                {href && <a href={href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-cyan hover:underline">@{c.github_username ?? "github"}</a>}
              </article>
            );
          })}
        </div>
      )}
      <ContributeGuide />
    </div>
  );
}
