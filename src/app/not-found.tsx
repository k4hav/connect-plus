import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo size="lg" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/dashboard" className="text-sm text-cyan hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
