"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

type Props = {
  title: string;
  subtitle?: string;
  panelHeading: React.ReactNode;
  panelText: string;
  children: React.ReactNode;
};

/** Two-pane auth card: form on the left, skewed brand "blade" on the right (desktop only). */
export function AuthShell({ title, subtitle, panelHeading, panelText, children }: Props) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="glass-strong relative grid w-full max-w-4xl overflow-hidden rounded-3xl md:grid-cols-[1.05fr_1fr]"
      >
        <section className="relative z-10 p-7 sm:p-10">
          <Logo size="md" className="mb-8" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </section>

        <aside
          aria-hidden="true"
          className="relative hidden flex-col justify-center overflow-hidden p-10 md:flex"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#0b2a3a] via-[#0a1a28] to-[#080a10]"
            style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0 100%)" }}
          />
          <div
            className="absolute inset-y-0 left-0 w-[14%] origin-top"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,181,71,0.0))",
            }}
          />
          <div
            className="absolute inset-y-0 left-0 w-px origin-top-left bg-gradient-to-b from-transparent via-amber/70 to-transparent"
            style={{ transform: "skewX(-8deg) translateX(14%)", left: "6%" }}
          />
          <div className="relative pl-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber">
              Raise Your Voice Together
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">{panelHeading}</h2>
            <p className="mt-3 max-w-xs text-sm text-white/55">{panelText}</p>
            <p className="mt-10 max-w-xs text-[11px] leading-relaxed text-white/35">
              Connect⁺ is an independent student-led initiative and is not officially affiliated with
              any university or government body.
            </p>
          </div>
        </aside>
      </motion.div>
    </main>
  );
}