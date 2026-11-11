import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a secure reset link."
      panelHeading={
        <>
          Let&apos;s get you <span className="text-amber">back in.</span>
        </>
      }
      panelText="Reset links expire quickly and work only once."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
