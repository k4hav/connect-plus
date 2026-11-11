import type { Metadata } from "next";
import Link from "next/link";
import { setReportStatus } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Reports" };

export default async function AdminReports() {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("id, report_type, target_type, target_id, title, description, status, created_at").in("status", ["open", "in_review"]).order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-3">
      {!data?.length ? <p className="text-sm text-muted">No open reports.</p> : data.map((r) => (
        <article key={r.id} className="glass rounded-2xl p-5 text-sm">
          <p className="text-xs text-white/45">{r.report_type}{r.target_type ? ` · ${r.target_type}` : ""} · {fmtDateTime(r.created_at)} · {r.status}</p>
          <p className="mt-1 font-medium">{r.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-muted">{r.description}</p>
          {r.target_type === "issue" && r.target_id && <Link href={`/issues/${r.target_id}`} className="mt-1 inline-block text-xs text-cyan hover:underline">Open issue</Link>}
          <div className="mt-3 flex gap-2 text-xs">
            {(["in_review", "resolved", "dismissed"] as const).map((s) => (
              <form key={s} action={setReportStatus.bind(null, r.id, s)}><button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10">{s.replace("_", " ")}</button></form>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
