"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fieldErrors, loginSchema, safeNext } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ onSwitch }: { onSwitch?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);

    // "Remember me" off => session ends when the browser closes (enforced by SessionGuard).
    try {
      if (fd.get("remember")) {
        document.cookie = "cp_session_only=; Max-Age=0; path=/; SameSite=Lax";
      } else {
        document.cookie = "cp_session_only=1; Max-Age=31536000; path=/; SameSite=Lax";
        sessionStorage.setItem("cp:alive", "1");
      }
    } catch {}

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (error) {
      if (error.code === "email_not_confirmed") {
        router.push(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
        return;
      }
      setFormError(
        error.code === "invalid_credentials"
          ? "Incorrect email or password."
          : "Could not sign you in. Please try again.",
      );
      return;
    }
    // Full page load: guarantees the new session cookie is sent and no old cached redirect is reused.
    setLoading(true);
    window.location.assign(safeNext(params.get("next")));
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {params.get("reset") === "success" && <Alert kind="success">Password updated. Sign in with your new password.</Alert>}
      {params.get("error") && <Alert kind="error">That link is invalid or has expired. Please request a new one.</Alert>}
      {formError && <Alert kind="error">{formError}</Alert>}

      <Input name="email" type="email" label="Email" autoComplete="email" placeholder="you@college.edu" error={errors.email} />
      <div className="relative">
        <Input
          name="password"
          type={show ? "text" : "password"}
          label="Password"
          autoComplete="current-password"
          error={errors.password}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-[34px] text-white/40 hover:text-white"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-white/20 bg-white/5 accent-[#13B89A]" />
          Remember me
        </label>
        <Link href="/forgot-password" className="text-xs text-amber hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Sign in
      </Button>

      <p className="text-center text-sm text-white/50">
        New to Connect⁺?{" "}
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="font-medium text-cyan hover:underline">
            Create an account
          </button>
        ) : (
          <Link href="/register" className="font-medium text-cyan hover:underline">
            Create an account
          </Link>
        )}
      </p>
    </form>
  );
}
