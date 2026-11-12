"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { otpSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Must match "Email OTP Length" in Supabase (Authentication > Sign In / Providers > Email). Supabase defaults to 8.
const LENGTH = Math.min(10, Math.max(6, Number(process.env.NEXT_PUBLIC_OTP_LENGTH) || 8));
const RESEND_SECONDS = 60;

export function VerifyOtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function setAt(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, idx) => (idx === i ? "" : x)));
      return;
    }
    // Handles typing and pasting multiple digits.
    setDigits((d) => {
      const next = [...d];
      clean.slice(0, LENGTH - i).split("").forEach((ch, k) => (next[i + k] = ch));
      return next;
    });
    refs.current[Math.min(i + clean.length, LENGTH - 1)]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = otpSchema.safeParse({ email, token: digits.join("") });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "signup" });
    if (error) {
      setLoading(false);
      setError(
        error.code === "otp_expired"
          ? "That code has expired. Request a new one."
          : "That code is incorrect. Check it and try again.",
      );
      return;
    }
    window.location.assign("/dashboard");
  }

  async function resend() {
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setError("Could not resend the code right now. Please wait a moment and try again.");
      return;
    }
    setCooldown(RESEND_SECONDS);
    setInfo("A new code has been sent.");
  }

  return (
    <form onSubmit={verify} className="space-y-5">
      {error && <Alert kind="error">{error}</Alert>}
      {info && <Alert kind="success">{info}</Alert>}

      <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            aria-label={`Digit ${i + 1}`}
            className={cn(
              "h-14 w-full max-w-[2.9rem] rounded-xl border bg-white/[0.04] text-center text-xl font-semibold text-white transition-colors focus:border-amber/70 focus:outline-none focus:ring-2 focus:ring-amber/20",
              d ? "border-amber/40" : "border-white/10",
            )}
          />
        ))}
      </div>

      <Button type="submit" loading={loading} variant="amber" size="lg" className="w-full">
        Verify &amp; continue
      </Button>

      <p className="text-center text-sm text-white/50">
        Didn&apos;t receive the code?{" "}
        {cooldown > 0 ? (
          <span className="text-amber">Resend in 0:{String(cooldown).padStart(2, "0")}</span>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-amber hover:underline">
            Resend code
          </button>
        )}
      </p>
      <p className="text-center text-xs text-white/35">
        <Link href="/register" className="hover:underline">Use a different email</Link>
      </p>
    </form>
  );
}
