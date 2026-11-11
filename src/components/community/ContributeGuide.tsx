import Link from "next/link";
import { DEVELOPER } from "@/lib/constants";
import { GITHUB_REPO_URL } from "@/lib/utils";

const CONTRIB_AREAS: [string, string][] = [
  ["Automated email sending", "The student connects their own Gmail with Google OAuth (gmail.send scope only). Tokens must be stored encrypted. Send one separate email per authority, ask for explicit confirmation before every send, and never claim a message was delivered or read just because Gmail accepted it."],
  ["Authority directory", "Add real contacts for BEU and each college from official pages only. Every entry needs a source URL. Never copy emails from third-party sites."],
  ["Sign in with Google", "Add Google login next to email and password, and ask for college, branch and year after the first sign in."],
  ["Bot protection and tests", "Add Cloudflare Turnstile on sign up, plus automated tests, accessibility checks and performance fixes."],
];

export function ContributeGuide() {
  const repo = GITHUB_REPO_URL || DEVELOPER.github;
  return (
    <section id="contribute" className="glass rounded-2xl p-5 scroll-mt-24" aria-labelledby="con-h">
        <h2 id="con-h" className="font-medium">How to contribute</h2>
        <p className="mt-1.5 text-sm text-muted">Never worked on open source? These steps are enough to start.</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Open the <a href={repo} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">GitHub project</a> and click <b className="text-ink">Fork</b>.</li>
          <li>Clone your fork, then run <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">npm install</code>.</li>
          <li>Create your own free Supabase project. In its SQL Editor run the files in <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">supabase/migrations</code> in order (0001 to 0005), then <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">supabase/seed.sql</code>.</li>
          <li>Copy <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.example</code> to <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> and fill in your project URL and publishable key. Never commit this file.</li>
          <li>Run <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">npm run dev</code> and open <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">http://localhost:3000</code>.</li>
          <li>Create a branch (<code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">git checkout -b my-feature</code>), make a small focused change, and run <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">npx tsc --noEmit</code> and <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">npm run build</code>.</li>
          <li>Commit, push to your fork, and open a Pull Request. Describe what you changed and how you tested it.</li>
          <li>After your work is approved, ask to be listed on the <Link href="/contributors" className="text-cyan hover:underline">Contributors</Link> page.</li>
        </ol>

        <h3 className="mt-5 text-sm font-medium">What we need most</h3>
        <ul className="mt-2 space-y-2.5">
          {CONTRIB_AREAS.map(([t, b]) => (
            <li key={t} className="rounded-xl border border-white/10 bg-black/10 p-3.5">
              <p className="text-sm font-medium">{t}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-medium">Ground rules</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>No secrets, passwords or service keys in the code or in a public environment variable.</li>
          <li>No fake data, fake statistics or fake verification. Verified always needs a source.</li>
          <li>Every new table needs Row Level Security. Keep the database rules as the final guard.</li>
          <li>Be kind and respectful in issues and reviews.</li>
        </ul>
    </section>
  );
}
