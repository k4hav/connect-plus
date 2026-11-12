import { createClient } from "@/lib/supabase/server";

export type SentRow = { sent_by: string; recipient_email: string; recipient_name: string | null; created_at: string; profiles: { full_name: string | null } | null };

export type SentSummary = {
  students: number;
  total: number;
  perRecipient: { email: string; name: string; count: number }[];
  recent: { who: string; to: string; at: string }[];
  mine: string[];
  counts: Record<string, number>;
};

/** Reads the public "who emailed whom" record for one issue and shapes it for display. */
export async function getSentSummary(issueId: string, userId: string): Promise<SentSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_sent")
    .select("sent_by, recipient_email, recipient_name, created_at, profiles(full_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false })
    .limit(1000);
  const rows = ((data ?? []) as unknown as SentRow[]);

  const per = new Map<string, { name: string; count: number }>();
  for (const r of rows) {
    const cur = per.get(r.recipient_email) ?? { name: r.recipient_name || r.recipient_email, count: 0 };
    cur.count += 1;
    per.set(r.recipient_email, cur);
  }
  const first = (n: string | null | undefined) => (n?.trim().split(/\s+/)[0] || "A student");
  return {
    students: new Set(rows.map((r) => r.sent_by)).size,
    total: rows.length,
    perRecipient: [...per.entries()].map(([email, v]) => ({ email, name: v.name, count: v.count })).sort((a, b) => b.count - a.count),
    recent: rows.slice(0, 8).map((r) => ({ who: r.sent_by === userId ? "You" : first(r.profiles?.full_name), to: r.recipient_name || r.recipient_email, at: r.created_at })),
    mine: rows.filter((r) => r.sent_by === userId).map((r) => r.recipient_email),
    counts: Object.fromEntries([...per.entries()].map(([e, v]) => [e, v.count])),
  };
}
