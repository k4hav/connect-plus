import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm";
import { emailSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) redirect("/register");

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the code sent to ${parsed.data}. You can also tap the link in that email.`}
      panelHeading={
        <>
          One quick <span className="text-amber">check.</span>
        </>
      }
      panelText="Verified accounts keep Connect⁺ free of spam and impersonation."
    >
      <VerifyOtpForm email={parsed.data} />
    </AuthShell>
  );
}