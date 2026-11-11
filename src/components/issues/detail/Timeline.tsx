import { fmtDateTime } from "@/lib/format";

type Event = {
  id: string;
  event_type: string;
  event_description: string;
  actor_name: string | null;
  created_at: string;
};

const DOT: Record<string, string> = {
  issue_created: "bg-cyan",
  status_changed: "bg-electric",
  issue_resolved: "bg-emerald",
  resolution_verified: "bg-emerald",
  issue_reopened: "bg-danger",
  moderation_action: "bg-danger",
  official_response_recorded: "bg-amber",
  evidence_verified: "bg-emerald",
};

export function Timeline({ events }: { events: Event[] }) {
  if (events.length === 0) return <p className="text-sm text-muted">No history yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-white/10 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#0b1220] ${DOT[e.event_type] ?? "bg-white/30"}`} aria-hidden="true" />
          <p className="text-sm text-ink">{e.event_description}</p>
          <p className="mt-0.5 text-xs text-white/40">
            {e.actor_name ? `${e.actor_name} · ` : ""}
            <time dateTime={e.created_at}>{fmtDateTime(e.created_at)}</time>
          </p>
        </li>
      ))}
    </ol>
  );
}
