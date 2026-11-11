"use client";

import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";
import { RegisterForm, type CollegeOption } from "./RegisterForm";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const EASE = "ease-[cubic-bezier(0.77,0,0.18,1)]";

/**
 * Login + register in one card. On desktop a brand panel slides across the card
 * and the two real forms swap places underneath it. On mobile only the active
 * form is shown and the swap is a simple fade. The URL follows the mode
 * (/login <-> /register) without a navigation.
 */
export function AuthSwitch({ initialMode, colleges = [] }: { initialMode: Mode; colleges?: CollegeOption[] }) {
  const [mode, setMode] = useState<Mode>(initialMode);

  function go(next: Mode) {
    if (next === mode) return;
    setMode(next);
    try {
      window.history.replaceState(null, "", next === "signin" ? "/login" : "/register");
    } catch {}
  }

  const signin = mode === "signin";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="glass-strong relative w-full max-w-5xl overflow-hidden rounded-3xl md:h-[760px]">
        {/* Sign in (left half) */}
        <section
          aria-label="Sign in"
          inert={!signin}
          className={cn(
            "flex flex-col justify-center p-7 sm:p-10 md:absolute md:inset-y-0 md:left-0 md:w-1/2 md:overflow-y-auto",
            "transition-opacity duration-500",
            signin ? "opacity-100 md:delay-500" : "hidden opacity-0 md:flex md:pointer-events-none",
          )}
        >
          <Logo size="md" className="mb-8" />
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-white/50">Pick up where your campus voice left off.</p>
          <div className="mt-7">
            <LoginForm onSwitch={() => go("signup")} />
          </div>
        </section>

        {/* Sign up (right half) */}
        <section
          aria-label="Create account"
          inert={signin}
          className={cn(
            "flex flex-col justify-center p-7 sm:p-10 md:absolute md:inset-y-0 md:left-1/2 md:w-1/2 md:overflow-y-auto",
            "transition-opacity duration-500",
            !signin ? "opacity-100 md:delay-500" : "hidden opacity-0 md:flex md:pointer-events-none",
          )}
        >
          <Logo size="md" className="mb-8" />
          <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
          <p className="mt-1.5 text-sm text-white/50">One account to raise issues, back others and track outcomes.</p>
          <div className="mt-7">
            <RegisterForm onSwitch={() => go("signin")} colleges={colleges} />
          </div>
        </section>

        {/* Sliding brand panel (desktop only) */}
        <aside
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-1/2 md:block",
            "transition-transform duration-[900ms]",
            EASE,
            signin ? "translate-x-full" : "translate-x-0",
          )}
        >
          <div
            className={cn("absolute inset-0 bg-gradient-to-br from-[#0f5a4b] via-[#0a3a36] to-[#07181c] transition-[clip-path] duration-[900ms]", EASE)}
            style={{
              clipPath: signin
                ? "polygon(14% 0, 100% 0, 100% 100%, 0 100%)"
                : "polygon(0 0, 86% 0, 100% 100%, 0 100%)",
            }}
          />
          {/* Amber seam on the slanted edge */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1="14" y1="0" x2="0" y2="100"
              stroke="#FFB547" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
              className={cn("transition-opacity duration-500", signin ? "opacity-70 delay-500" : "opacity-0")}
            />
            <line
              x1="86" y1="0" x2="100" y2="100"
              stroke="#FFB547" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
              className={cn("transition-opacity duration-500", !signin ? "opacity-70 delay-500" : "opacity-0")}
            />
          </svg>

          <PanelCopy
            visible={signin}
            side="right"
            heading={<>Welcome <span className="font-light italic text-amber">back.</span></>}
            text="Your voice starts here. Connect with students, raise concerns and move campus issues forward."
          />
          <PanelCopy
            visible={!signin}
            side="left"
            heading={<>Start your <span className="font-light italic text-amber">first issue.</span></>}
            text="Your voice starts here. Join students raising campus concerns and following each one until it is actually resolved."
          />
        </aside>
      </div>
    </main>
  );
}

function PanelCopy({
  visible,
  side,
  heading,
  text,
}: {
  visible: boolean;
  side: "left" | "right";
  heading: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-center p-10 transition-[opacity,transform] duration-700",
        side === "right" ? "pl-14" : "pr-14",
        visible ? "translate-x-0 opacity-100 delay-500" : cn("opacity-0", side === "right" ? "translate-x-6" : "-translate-x-6"),
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber">Connect⁺</p>
      <h2 className="mt-3 text-4xl font-medium leading-tight text-[#F7F1E3]">{heading}</h2>
      <p className="mt-3 max-w-xs text-sm text-[#F7F1E3]/65">{text}</p>
      <p className="mt-10 max-w-xs text-[11px] leading-relaxed text-white/35">
        Connect⁺ is an independent student-led initiative and is not officially affiliated with any university or
        government body.
      </p>
    </div>
  );
}
