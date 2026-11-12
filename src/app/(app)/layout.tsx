import Link from "next/link";
import { TopBar, LogoBox } from "@/components/shell/TopBar";
import { MainNav } from "@/components/shell/MainNav";
import { DevNotice } from "@/components/shell/DevNotice";
import { SideRail } from "@/components/shell/SideRail";
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
    <div className="min-h-dvh px-3 py-3 pb-28 sm:px-4 md:pb-3">
      <SessionGuard />
      <div className="mx-auto flex w-full max-w-[1800px] items-start gap-3">
        <aside className="sticky top-3 hidden h-[calc(100dvh-24px)] shrink-0 flex-col gap-3 md:flex">
          <LogoBox />
          <SideRail />
        </aside>
        <div className="min-w-0 flex-1">
          <TopBar unread={unread.count ?? 0} name={profile.data?.full_name ?? "Student"} isStaff={!!role} githubRepoUrl={GITHUB_REPO_URL} />
          <DevNotice className="-mt-1 mb-3 flex justify-center md:hidden" />
          <main className="app-main glass-panel rounded-[27px] p-4 sm:p-8">{children}</main>
          <Footer />
        </div>
      </div>
      <MainNav />
    </div>
  );
}
