import Link from "next/link";
import { requireStaff } from "@/lib/auth";

const TABS = [
  ["/admin", "Overview", false],
  ["/admin/resolutions", "Resolutions", false],
  ["/admin/reports", "Reports", false],
  ["/admin/authorities", "Authorities", true],
  ["/admin/contributors", "Contributors", true],
  ["/admin/suggestions", "Suggestions", true],
  ["/admin/logs", "Logs", false],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireStaff();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted">Signed in as {role}. Server and database rules re-check every action.</p>
      </header>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
        {TABS.filter(([, , adminOnly]) => !adminOnly || role === "admin").map(([href, label]) => (
          <Link key={href} href={href} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-muted hover:text-ink">{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
