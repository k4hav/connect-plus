"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = passwordSchema.safeParse(fd.get("password"));
    if (!parsed.success) return setErrors({ password: parsed.error.issues[0].message });
    if (fd.get("confirm") !== fd.get("password")) return setErrors({ confirm: "Passwords do not match" });
    setErrors({});
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) {
      setLoading(false);
      setFormError("Could not update your password. The link may have expired; request a new one.");
      return;
    }
    // End the recovery session so the user signs in fresh with the new password.
    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert kind="error">{formError}</Alert>}
      <Input name="password" type="password" label="New password" autoComplete="new-password" error={errors.password} hint="8+ characters with a letter and a number" />
      <Input name="confirm" type="password" label="Confirm new password" autoComplete="new-password" error={errors.confirm} />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Update password
      </Button>
    </form>
  );
}
