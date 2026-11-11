import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUGGESTION_CATEGORIES } from "@/lib/constants";
import { SuggestionReview } from "./SuggestionReview";

export const metadata: Metadata = { title: "Admin · Suggestions" };

export default async function AdminSuggestions() {
  await requireStaff("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("suggestions").select("id, title, description, category, status, admin_note").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-3">
      {!data?.length ? <p className="text-sm text-muted">No suggestions yet.</p> : data.map((s) => (
        <article key={s.id} className="glass rounded-2xl p-5 text-sm">
          <p className="text-xs text-white/45">{SUGGESTION_CATEGORIES[s.category]}</p>
          <p className="mt-1 font-medium">{s.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-muted">{s.description}</p>
          <SuggestionReview id={s.id} status={s.status} note={s.admin_note} />
        </article>
      ))}
    </div>
  );
}
