import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSwitch } from "@/components/auth/AuthSwitch";
import { getColleges } from "@/lib/data/reference";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const colleges = await getColleges();
  return (
    <Suspense>
      <AuthSwitch initialMode="signup" colleges={colleges} />
    </Suspense>
  );
}
