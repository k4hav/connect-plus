import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthSwitch } from "@/components/auth/AuthSwitch";
import { getColleges } from "@/lib/data/reference";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const colleges = await getColleges();
  return (
    <Suspense>
      <AuthSwitch initialMode="signin" colleges={colleges} />
    </Suspense>
  );
}
