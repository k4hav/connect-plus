"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validation";
import { SITE_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error && error.code === "over_email_send_rate_limit") {
      setError("Too many requests. Please wait a few minutes and try again.");
      return;
    }
    // Same message whether or not the account exists, to avoid revealing registered emails.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert kind="success">If an account exists for that email, a reset link is on its way.</Alert>
        <Link href="/login" className="block text-center text-sm text-cyan hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      <Input name="email" type="email" label="Email" autoComplete="email" />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Send reset link
      </Button>
      <Link href="/login" className="block text-center text-sm text-white/50 hover:text-white">
        Back to sign in
      </Link>
    </form>
  );
}
