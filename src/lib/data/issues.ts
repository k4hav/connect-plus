import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { safeSearch } from "@/lib/links";
import type { FeedIssue } from "@/components/issues/IssueCard";

export type FeedParams = {
  sort?: string;
  q?: string;
  category?: string;
  college?: string;
  status?: string;
  page: number;
  /** Extra constraints used by Followed / Activity pages. */
  followedOnly?: boolean;
  supportedOnly?: boolean;
  createdBy?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Paginated, filtered feed from the RLS-aware issue_feed view. */
export async function fetchIssueFeed(p: FeedParams) {
  const supabase = await createClient();
  let query = supabase.from("issue_feed").select("*", { count: "exact" });

  const q = safeSearch(p.q);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (p.category && /^[a-z0-9-]{2,40}$/.test(p.category)) query = query.eq("category", p.category);
  if (p.college && UUID.test(p.college)) query = query.eq("college_id", p.college);
  if (p.status && /^[a-z_]{3,30}$/.test(p.status)) query = query.eq("status", p.status);
  if (p.followedOnly) query = query.eq("followed_by_me", true);
  if (p.supportedOnly) query = query.eq("supported_by_me", true);
  if (p.createdBy) query = query.eq("created_by", p.createdBy);

  switch (p.sort) {
    case "supported":
      query = query.order("support_count", { ascending: false }).order("published_at", { ascending: false });
      break;
    case "newest":
      query = query.order("published_at", { ascending: false });
      break;
    case "updated":
      query = query.order("last_activity_at", { ascending: false });
      break;
    case "resolved":
      query = query.eq("status", "resolved").order("last_activity_at", { ascending: false });
      break;
    default:
      query = query.order("trending_score", { ascending: false });
  }

  const from = (p.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  return { issues: (data ?? []) as FeedIssue[], total: count ?? 0, error };
}
