import type { Metadata } from "next";
import { BadgeCheck, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { safeSearch, parseHttpUrl } from "@/lib/links";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Authority Directory" };

export default async function AuthoritiesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = safeSearch(sp.q);
  const supabase = await createClient();
  let query = supabase
    .from("authority_directory")
    .select("id, authority_name, designation, department, official_email, institution, source_url, verification_status, last_verified_at", { count: "exact" })
    .eq("is_active", true);
  if (q) query = query.or(`authority_name.ilike.%${q}%,department.ilike.%${q}%,designation.ilike.%${q}%,institution.ilike.%${q}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.order("verification_status", { ascending: false }).order("authority_name").range(from, from + PAGE_SIZE - 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Authority Directory</h1>
        <p className="mt-1 text-sm text-muted">Contacts are added by administrators. “Verified” always shows its source and date. Never assume an unverified contact is correct.</p>
      </header>
      <form className="flex gap-2" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, department, designation" aria-label="Search authorities" className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20" />
        <button className="h-11 rounded-xl bg-cyan px-4 text-sm font-medium text-white hover:bg-bright">Search</button>
      </form>
      {!data?.length ? (
        <EmptyState icon={Landmark} title="No authorities listed">The directory is empty or nothing matched. Administrators add verified contacts with a source.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => {
            const src = parseHttpUrl(a.source_url);
            return (
              <article key={a.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {a.verification_status === "verified" ? <Badge tone="green"><BadgeCheck className="mr-1 h-3 w-3" aria-hidden="true" />Verified</Badge> : <Badge tone="neutral">{a.verification_status === "pending" ? "Pending verification" : "Unverified"}</Badge>}
                </div>
                <h2 className="mt-2 font-medium">{a.authority_name}</h2>
                <p className="text-sm text-muted">{[a.designation, a.department, a.institution].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 break-all text-sm"><a href={`mailto:${a.official_email}`} className="text-cyan hover:underline">{a.official_email}</a></p>
                {a.verification_status === "verified" && (
                  <p className="mt-2 text-xs text-white/45">
                    Verified {fmtDate(a.last_verified_at)}
                    {src && <> · <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-cyan hover:underline">Source</a></>}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath="/authorities" params={{ q: sp.q }} />
    </div>
  );
}
