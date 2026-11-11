import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/constants";
import { ISSUE_STATUSES } from "@/lib/constants";

const TONES: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/5 text-muted",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  blue: "border-electric/30 bg-electric/10 text-[#9db5ff]",
  amber: "border-amber/30 bg-amber/10 text-amber",
  green: "border-emerald/30 bg-emerald/10 text-[#4fe0c3]",
  red: "border-danger/30 bg-danger/10 text-red-300",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = ISSUE_STATUSES[status] ?? { label: status, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function MappedBadge({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value: string }) {
  const s = map[value] ?? { label: value, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
