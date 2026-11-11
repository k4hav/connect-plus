import type { Metadata } from "next";
import { BugForm } from "./BugForm";
import { GITHUB_REPO_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Report a Bug" };

export default function ReportBugPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Report a Bug</h1>
        <p className="mt-1 text-sm text-muted">Found something broken? Tell us. Reports are saved on Connect⁺ for the team to review.</p>
      </header>
      <div className="glass-strong rounded-2xl p-5 sm:p-6"><BugForm /></div>
      {GITHUB_REPO_URL && (
        <p className="text-sm text-muted">
          Prefer GitHub?{" "}
          <a href={`${GITHUB_REPO_URL.replace(/\/$/, "")}/issues/new`} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Open a GitHub issue</a>. Nothing is sent there automatically.
        </p>
      )}
    </div>
  );
}
