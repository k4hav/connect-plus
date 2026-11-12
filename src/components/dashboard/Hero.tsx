import Link from "next/link";
import { ArrowRight, Megaphone, PlusCircle } from "lucide-react";

/** Top of the dashboard. The rings spread out like a voice carrying across campus. */
export function Hero() {
  return (
    <section className="reveal relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0c0e] p-7 sm:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 -z-10 h-[420px] w-[520px] bg-[radial-gradient(closest-side,rgba(255,40,55,0.28),transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-1/2 -z-10 hidden h-[420px] w-[420px] -translate-y-1/2 sm:block lg:right-10 lg:h-[560px] lg:w-[560px]">
        <span className="ripple" />
        <span className="ripple" style={{ animationDelay: "1.3s" }} />
        <span className="ripple" style={{ animationDelay: "2.6s" }} />
        <span className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-cyan to-[#8e1020] shadow-[0_0_80px_10px_rgba(255,59,71,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <Megaphone className="h-9 w-9 text-white" />
        </span>
      </div>

      <h1 className="font-display max-w-2xl text-[40px] font-semibold leading-[1.02] tracking-tight sm:text-6xl">
        Problem in the system?<br />Make it heard.
      </h1>
      <p className="reveal mt-5 max-w-md text-base leading-relaxed text-white/70" style={{ "--i": 1 } as React.CSSProperties}>
        Report an issue, get other students to support it, and send it to the people who can fix it.
      </p>
      <div className="reveal mt-8 flex flex-wrap gap-3" style={{ "--i": 2 } as React.CSSProperties}>
        <Link href="/issues/new" className="press inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan px-6 text-sm font-semibold text-white shadow-[0_12px_32px_-10px_rgba(255,59,71,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-bright">
          <PlusCircle className="h-4 w-4" aria-hidden="true" /> Raise an issue
        </Link>
        <Link href="/issues" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 text-sm font-medium backdrop-blur transition hover:bg-white/10">
          See all issues <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
