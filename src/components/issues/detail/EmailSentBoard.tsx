import { Mail } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { SentSummary } from "@/lib/data/email-sent";

/** Public record: how many students emailed, and which offices they emailed. */
export function EmailSentBoard({ summary }: { summary: SentSummary }) {
  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="sent-h">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan"><Mail className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <h2 id="sent-h" className="font-display text-lg font-semibold">Emails sent</h2>
          <p className="text-sm text-muted">
            {summary.students === 0
              ? "No one has recorded an email yet. Be the first."
              : `${summary.students} ${summary.students === 1 ? "student has" : "students have"} emailed about this issue (${summary.total} ${summary.total === 1 ? "email" : "emails"} in total).`}
          </p>
        </div>
      </div>

      {summary.perRecipient.length > 0 && (
        <ul className="mt-4 space-y-2">
          {summary.perRecipient.map((r) => (
            <li key={r.email} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-2.5 text-sm">
              <span className="min-w-0 break-words">{r.name}</span>
              <span className="shrink-0 rounded-full bg-cyan/15 px-2.5 py-0.5 text-xs font-medium text-cyan">{r.count} {r.count === 1 ? "email" : "emails"}</span>
            </li>
          ))}
        </ul>
      )}

      {summary.recent.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted">Latest</p>
          <ul className="mt-1.5 space-y-1 text-xs text-white/70">
            {summary.recent.map((e, i) => (
              <li key={i}>{e.who} emailed {e.to} · {timeAgo(e.at)}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
