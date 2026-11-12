import type { Metadata } from "next";
import Link from "next/link";
import { DEVELOPER } from "@/lib/constants";

export const metadata: Metadata = { title: "About Connect⁺" };

const SECTIONS: [string, string][] = [
  ["What Connect⁺ is", "A student-led civic-tech platform for raising campus issues, gathering support, reaching the right authorities and following every issue until there is a verified outcome."],
  ["Support is not proof", "Supports show popularity, not verified fact. Evidence stays Pending until a moderator verifies it. An issue becomes Resolved only after a moderator verifies the resolution, and you can ask to reopen it with new evidence."],
  ["Your data", "No files are uploaded; evidence is linked from external sources. Your email is never shown to other students. Row Level Security protects every table."],
  ["Independence", "Connect⁺ is an independent student-led initiative and is not officially affiliated with any university or government body unless formal authorization is obtained."],
];

const USE_STEPS: [string, string][] = [
  ["Create your account", "Sign up with your email, college, branch and year. Enter the code sent to your email. If your college is not in the list, add it later from Profile or while raising an issue."],
  ["Raise an issue", "Click Raise Issue. Write a clear title and a factual description (what, since when, who is affected). Pick a category and your college. Add up to 3 evidence links (YouTube, Instagram, X, news, official sites). We never store files."],
  ["Support and follow", "Support an issue you agree with. One support per student. Follow it to get notifications when something changes. Add comments with facts or suggestions."],
  ["Write to the authorities", "Open the issue and press Copy Demand. Paste it into any AI tool (ChatGPT, Gemini, Claude) and ask it to write a formal email. Read it carefully and fix any wrong fact."],
  ["Send the email", "Open Email authorities on the issue. Paste the subject and body, choose the authorities from the directory, then press Open in Gmail for each one. Each authority gets a separate email from your own account. Press Save draft to keep a record."],
  ["Track the outcome", "When an authority replies, staff record the official response. When the problem is fixed, someone proposes a resolution with proof links. A moderator verifies it and only then the issue shows Resolved. If the problem comes back, request a reopen with new evidence."],
];


export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">About Connect⁺</h1>
        <p className="mt-1 text-sm text-cyan">Raise Your Voice Together.</p>
        <nav aria-label="On this page" className="mt-3 flex flex-wrap gap-2 text-xs">
          {[["#how", "How to use"], ["#note", "Note from the developer"], ["/contributors#contribute", "How to contribute"], ["#roadmap", "Roadmap"]].map(([href, label]) => (
            <a key={href} href={href} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-muted hover:text-ink">{label}</a>
          ))}
        </nav>
      </header>

      {SECTIONS.map(([t, b]) => (
        <section key={t} className="glass rounded-2xl p-5">
          <h2 className="font-medium">{t}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
        </section>
      ))}

      <section id="how" className="glass rounded-2xl p-5 scroll-mt-24" aria-labelledby="how-h">
        <h2 id="how-h" className="font-medium">How to use Connect⁺</h2>
        <ol className="mt-3 space-y-3">
          {USE_STEPS.map(([t, b], i) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-xs font-semibold text-cyan">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="note" className="glass-strong rounded-2xl p-5 scroll-mt-24" aria-labelledby="note-h">
        <h2 id="note-h" className="font-medium">A note from the developer</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          I wanted Connect⁺ to send emails to authorities automatically, straight from a student&apos;s own Gmail account. That was the dream version.
          I am a student building this alone, and my time is limited. So for now I chose a simple shortcut: you write the email, choose the authorities, and open it in Gmail with one click.
          It works today, and nothing is ever sent without your approval.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If you have time and the skills, you are very welcome to build the missing pieces with me. I respect every contribution, big or small: code, design, testing, ideas, or a bug report. Thank you for helping.
        </p>
        <p className="mt-3 text-sm text-white/60">— {DEVELOPER.name}, {DEVELOPER.role}</p>
      </section>

      <section id="contribute" className="glass rounded-2xl p-5 scroll-mt-24" aria-labelledby="con-h">
        <h2 id="con-h" className="font-medium">Want to contribute?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Everything you need is on the <Link href="/contributors#contribute" className="text-cyan hover:underline">Contributors page</Link>: step by step setup, what we need most, and the ground rules.
        </p>
      </section>

      <section id="roadmap" className="glass rounded-2xl p-5 scroll-mt-24" aria-labelledby="road-h">
        <h2 id="road-h" className="font-medium">Roadmap</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Automated email sending from the student&apos;s own Gmail, with an explicit confirmation before every send</li>
          <li>A fuller, verified directory of university and college authorities</li>
          <li>Sign in with Google</li>
          <li>Bot protection on sign up (Cloudflare Turnstile)</li>
        </ul>
      </section>

      <p className="text-sm text-muted">
        <Link href="/developer" className="text-cyan hover:underline">Developer</Link> · <Link href="/contributors" className="text-cyan hover:underline">Contributors</Link> · <Link href="/report-bug" className="text-cyan hover:underline">Report a bug</Link>
      </p>
    </div>
  );
}
