"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fieldErrors, registerSchema } from "@/lib/validation";
import { SITE_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export type CollegeOption = { id: string; college_name: string };

export function RegisterForm({ onSwitch, colleges = [] }: { onSwitch?: () => void; colleges?: CollegeOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      confirm: fd.get("confirm"),
      collegeId: fd.get("collegeId") ?? "",
      branch: fd.get("branch") ?? "",
      academicYear: fd.get("academicYear") ?? "",
      terms: fd.get("terms") ?? "",
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);

    const v = parsed.data;
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        // Validated again by the database signup trigger.
        data: {
          full_name: v.fullName,
          college_id: v.collegeId || "",
          branch: v.branch || "",
          academic_year: v.academicYear || "",
        },
        emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      const code = error.code ?? "";
      const msg = (error.message ?? "").toLowerCase();
      setFormError(
        code === "over_email_send_rate_limit" || code === "over_request_rate_limit"
          ? "Too many attempts. Please wait a few minutes and try again."
          : code === "weak_password"
            ? "That password is too weak. Try a longer one."
            : code === "user_already_exists" || code === "email_exists" || msg.includes("already registered")
              ? "This email is already registered. Try signing in instead."
              : msg.includes("sending") && msg.includes("email")
                ? "We could not send the verification email. The email (SMTP) setup needs fixing in Supabase."
                : msg.includes("database error")
                  ? "Account setup failed in the database. Run the setup SQL in Supabase and try again."
                  : `Could not create your account (${error.code ?? error.status ?? "unknown"}). Please try again.`,
      );
      return;
    }
    // With email confirmation enabled no session exists yet: send the user to verification.
    if (!data.session) {
      router.push(`/verify?email=${encodeURIComponent(v.email)}`);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3.5">
      {formError && <Alert kind="error">{formError}</Alert>}
      <Input name="fullName" label="Full name" autoComplete="name" error={errors.fullName} />
      <Input name="email" type="email" label="Email" autoComplete="email" placeholder="you@college.edu" error={errors.email} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input name="password" type="password" label="Password" autoComplete="new-password" error={errors.password} />
        <Input name="confirm" type="password" label="Confirm password" autoComplete="new-password" error={errors.confirm} />
      </div>
      <p className="-mt-1 text-xs text-white/40">8+ characters with a letter and a number</p>
      <Select
        name="collegeId"
        label="College"
        placeholder={colleges.length ? "Select your college" : "No colleges listed yet"}
        options={colleges.map((c) => ({ value: c.id, label: c.college_name }))}
        hint="Not listed? Skip it now. After signing in, add your college from Profile or while raising an issue."
        error={errors.collegeId}
      />
      <div className="grid gap-3.5 sm:grid-cols-[1fr_7rem]">
        <Input name="branch" label="Branch" placeholder="e.g. CSE" error={errors.branch} />
        <Select
          name="academicYear"
          label="Year"
          placeholder="—"
          options={[1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` }))}
          error={errors.academicYear}
        />
      </div>
      <label className="flex items-start gap-2.5 text-xs text-muted">
        <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-[#13B89A]" />
        <span>
          I understand Connect⁺ is an independent student initiative, and I will post truthful, respectful content.
          {errors.terms && <span className="mt-1 block text-danger">{errors.terms}</span>}
        </span>
      </label>
      <Button type="submit" loading={loading} className="w-full" size="lg">
        Create account
      </Button>
      <p className="text-center text-sm text-white/50">
        Already have an account?{" "}
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="font-medium text-cyan hover:underline">
            Sign in
          </button>
        ) : (
          <Link href="/login" className="font-medium text-cyan hover:underline">
            Sign in
          </Link>
        )}
      </p>
    </form>
  );
}
