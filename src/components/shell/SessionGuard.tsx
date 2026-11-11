"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Implements "Remember me" = off. The login form sets a persistent cp_session_only cookie and a
 * sessionStorage marker. In a brand-new browser session the marker is gone, so we sign out.
 */
export function SessionGuard() {
  const router = useRouter();
  useEffect(() => {
    try {
      const sessionOnly = document.cookie.split("; ").some((c) => c === "cp_session_only=1");
      if (!sessionOnly) return;
      if (sessionStorage.getItem("cp:alive")) return;
      document.cookie = "cp_session_only=; Max-Age=0; path=/; SameSite=Lax";
      createClient()
        .auth.signOut()
        .then(() => {
          router.replace("/login");
          router.refresh();
        });
    } catch {}
  }, [router]);
  return null;
}
