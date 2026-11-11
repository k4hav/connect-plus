import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in via /auth/callback; without that session there is nothing to reset.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something you haven't used elsewhere."
      panelHeading={
        <>
          Fresh <span className="text-amber">start.</span>
        </>
      }
      panelText="After updating, you'll sign in again with your new password."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
