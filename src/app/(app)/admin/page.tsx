import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [issues, hidden, reports, res, reopen, ev, sugg] = await Promise.all([
    supabase.from("issues").select("id", head),
    supabase.from("issues").select("id", head).neq("moderation_status", "visible"),
    supabase.from("reports").select("id", head).eq("status", "open"),
    supabase.from("issue_resolutions").select("id", head).eq("verification_status", "pending_verification"),
    supabase.from("reopen_requests").select("id", head).eq("status", "pending"),
    supabase.from("issue_evidence").select("id", head).eq("verification_status", "pending"),
    supabase.from("suggestions").select("id", head).eq("status", "pending"),
  ]);
  const cards = [
    ["Total issues", issues.count, "/issues"],
    ["Hidden / removed", hidden.count, "/issues"],
    ["Open reports", reports.count, "/admin/reports"],
    ["Resolutions to verify", res.count, "/admin/resolutions"],
    ["Reopen requests", reopen.count, "/admin/resolutions"],
    ["Evidence pending (open the issue)", ev.count, "/issues"],
    ["Pending suggestions", sugg.count, "/admin/suggestions"],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(([label, n, href]) => (
        <Link key={label} href={href} className="glass glass-hover rounded-2xl p-4">
          <p className="text-2xl font-semibold tabular-nums">{n ?? 0}</p>
          <p className="text-xs text-muted">{label}</p>
        </Link>
      ))}
    </div>
  );
}
