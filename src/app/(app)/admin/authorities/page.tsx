import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { setAuthorityActive } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AuthorityForm } from "./AuthorityForm";
import { BulkForm } from "./BulkForm";

export const metadata: Metadata = { title: "Admin · Authorities" };

export default async function AdminAuthorities() {
  await requireStaff("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("authority_directory").select("id, authority_name, official_email, verification_status, is_active").order("authority_name").limit(200);
  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-2xl p-5"><h2 className="mb-3 font-medium">Add authority</h2><AuthorityForm /></section>
      <section className="glass rounded-2xl p-5"><h2 className="mb-1 font-medium">Bulk import</h2><p className="mb-3 text-xs text-muted">Paste many contacts at once. Copy emails only from official pages.</p><BulkForm /></section>
      <ul className="space-y-2">
        {(data ?? []).map((a) => (
          <li key={a.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-sm">
            <div><p className="font-medium">{a.authority_name}</p><p className="break-all text-xs text-muted">{a.official_email}</p></div>
            <div className="flex items-center gap-2">
              <Badge tone={a.verification_status === "verified" ? "green" : "neutral"}>{a.verification_status}</Badge>
              <form action={setAuthorityActive.bind(null, a.id, !a.is_active)}><button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">{a.is_active ? "Deactivate" : "Activate"}</button></form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}