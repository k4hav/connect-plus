import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, parsePage } from "@/components/ui/pagination";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/community";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };
const SIZE = 20;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const page = parsePage((await searchParams).page);
  const supabase = await createClient();
  const from = (page - 1) * SIZE;
  const { data, count } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at, related_issue_id", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + SIZE - 1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {!!data?.some((n) => !n.is_read) && (
          <form action={markAllNotificationsRead}>
            <button className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm hover:bg-white/10">Mark all as read</button>
          </form>
        )}
      </header>
      {!data?.length ? (
        <EmptyState icon={Bell} title="You are all caught up">Updates on issues you follow or raise will appear here.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {data.map((n) => (
            <li key={n.id} className={cn("glass flex items-start gap-3 rounded-2xl p-4", !n.is_read && "border-cyan/30")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.is_read ? "bg-white/15" : "bg-cyan")} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 break-words text-sm text-muted">{n.message}</p>
                <p className="mt-1 text-xs text-white/35">
                  {timeAgo(n.created_at)}
                  {n.related_issue_id && <> · <Link href={`/issues/${n.related_issue_id}`} className="text-cyan hover:underline">Open issue</Link></>}
                </p>
              </div>
              {!n.is_read && (
                <form action={markNotificationRead.bind(null, n.id)}>
                  <button className="text-xs text-muted hover:text-ink">Mark read</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} total={count ?? 0} pageSize={SIZE} basePath="/notifications" />
    </div>
  );
}
