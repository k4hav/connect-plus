import type { Metadata } from "next";
import { MappedBadge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUGGESTION_CATEGORIES, SUGGESTION_STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { SuggestionForm } from "./SuggestionForm";

export const metadata: Metadata = { title: "Feedback & Suggestions" };

export default async function FeedbackPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("id, title, category, status, admin_note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Feedback &amp; Suggestions</h1>
        <p className="mt-1 text-sm text-muted">Tell us how to make Connect⁺ better. Every suggestion is read.</p>
      </header>
      <div className="glass-strong rounded-2xl p-5 sm:p-6"><SuggestionForm /></div>
      <section aria-labelledby="my-s">
        <h2 id="my-s" className="mb-3 text-lg font-medium">Your suggestions</h2>
        {!data?.length ? <p className="text-sm text-muted">You have not submitted any suggestions yet.</p> : (
          <ul className="space-y-3">
            {data.map((s) => (
              <li key={s.id} className="glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2"><MappedBadge map={SUGGESTION_STATUSES} value={s.status} /><span className="text-xs text-white/40">{SUGGESTION_CATEGORIES[s.category]} · {fmtDate(s.created_at)}</span></div>
                <p className="mt-1.5 text-sm font-medium">{s.title}</p>
                {s.admin_note && <p className="mt-1 text-sm text-muted">Note from the team: {s.admin_note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
