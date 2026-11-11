import Link from "next/link";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { SessionGuard } from "@/components/shell/SessionGuard";
import { Logo } from "@/components/brand/Logo";
import { getCurrentUser, getStaffRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_REPO_URL } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Public pages (About, Report a Bug) render for signed-out visitors without the app chrome.
  if (!user) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/login" aria-label="Connect⁺ home">
            <Logo size="md" />
          </Link>
          <Link href="/login" className="text-sm text-cyan hover:underline">
            Sign in
          </Link>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  const supabase = await createClient();
  const [role, profile, unread] = await Promise.all([
    getStaffRole(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <SessionGuard />
      <Sidebar isStaff={!!role} githubRepoUrl={GITHUB_REPO_URL} />
      <div className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-8 md:py-5">
        <div className="mx-auto w-full max-w-6xl flex-1">
          <Header unread={unread.count ?? 0} name={profile.data?.full_name ?? "Student"} />
          <main>{children}</main>
        </div>
        <div className="mx-auto w-full max-w-6xl">
          <Footer />
        </div>
      </div>
    </div>
  );
}
