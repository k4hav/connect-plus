import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Logs" };

export default async function AdminLogs() {
  const supabase = await createClient();
  const { data } = await supabase.from("moderation_logs").select("id, target_type, target_id, action, reason, created_at").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="text-xs text-white/40"><tr><th className="p-3">When</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Reason</th></tr></thead>
        <tbody>
          {(data ?? []).map((l) => (
            <tr key={l.id} className="border-t border-white/5">
              <td className="p-3 text-xs text-muted">{fmtDateTime(l.created_at)}</td>
              <td className="p-3">{l.action}</td>
              <td className="p-3 text-xs text-muted">{l.target_type}</td>
              <td className="p-3 text-xs text-muted">{l.reason ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data?.length && <p className="p-4 text-sm text-muted">No moderation actions recorded yet. The log is append-only.</p>}
    </div>
  );
}
