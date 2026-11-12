"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Search, Send } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { saveEmailDraft } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

type Authority = {
  id: string;
  authority_name: string;
  designation: string | null;
  department: string | null;
  official_email: string;
  institution: string | null;
  verification_status: string;
};

export function EmailWorkflow({ issueId, demand, authorities }: { issueId: string; demand: string; authorities: Authority[] }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return authorities;
    return authorities.filter((a) => [a.authority_name, a.designation, a.department, a.institution].some((v) => v?.toLowerCase().includes(q)));
  }, [authorities, query]);

  const chosen = authorities.filter((a) => selected.includes(a.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-5">
        <h2 className="font-medium">1. Get a draft from your AI tool</h2>
        <p className="mt-1 text-sm text-muted">Copy the demand, paste it into ChatGPT, Gemini, Claude or any assistant, and ask it to write the email. You decide which tool to use.</p>
        <div className="mt-3">
          <CopyButton variant="primary" icon="spark" label="Copy Demand" copiedLabel="Demand copied" text={demand} />
        </div>
      </section>

      <ActionForm action={saveEmailDraft.bind(null, issueId, selected)} hideSubmit resetOnSuccess={false} className="space-y-6">
        {(e) => (
          <>
            <section className="glass rounded-2xl p-5">
              <h2 className="font-medium">2. Paste the email you reviewed</h2>
              <div className="mt-3 space-y-3">
                <Input name="subject" label="Subject" value={subject} onChange={(ev) => setSubject(ev.target.value)} maxLength={200} error={e.subject} />
                <Textarea name="email_body" label="Email body" rows={10} value={body} onChange={(ev) => setBody(ev.target.value)} maxLength={10000} error={e.email_body} hint="Check every fact. Replace placeholders like [Your Name] before sending." />
              </div>
            </section>

            <section className="glass rounded-2xl p-5">
              <h2 className="font-medium">3. Choose authorities</h2>
              <p className="mt-1 text-sm text-muted">Only directory entries are listed. Verified means a source and date are on record.</p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(ev) => setQuery(ev.target.value)}
                  placeholder="Search name, department, designation"
                  aria-label="Search authorities"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/20"
                />
              </div>
              {authorities.length === 0 ? (
                <p className="mt-4 text-sm text-muted">The authority directory is empty. An administrator must add verified contacts first.</p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {filtered.map((a) => {
                    const on = selected.includes(a.id);
                    return (
                      <li key={a.id}>
                        <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors", on ? "border-cyan/40 bg-cyan/5" : "border-white/10 bg-black/10 hover:border-white/20")}>
                          <input type="checkbox" checked={on} onChange={() => toggle(a.id)} className="mt-1 h-4 w-4 accent-[#43CFFF]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{a.authority_name}</span>
                              {a.verification_status === "verified" ? (
                                <Badge tone="green"><BadgeCheck className="mr-1 h-3 w-3" aria-hidden="true" />Verified</Badge>
                              ) : (
                                <Badge tone="neutral">Unverified</Badge>
                              )}
                            </span>
                            <span className="block text-xs text-muted">{[a.designation, a.department, a.institution].filter(Boolean).join(" · ")}</span>
                            <span className="block break-all text-xs text-white/40">{a.official_email}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                  {filtered.length === 0 && <li className="text-sm text-muted">No authority matches your search.</li>}
                </ul>
              )}
            </section>

            <section className="glass-strong rounded-2xl p-5">
              <h2 className="font-medium">4. Preview and confirm</h2>
              <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <p><span className="text-muted">Subject:</span> {subject || <em className="text-white/30">not entered</em>}</p>
                <p className="whitespace-pre-wrap break-words text-muted">{body || <em className="text-white/30">Email body will appear here.</em>}</p>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">Recipients ({chosen.length})</p>
                  {chosen.length === 0 ? (
                    <p className="text-white/30"><em>None selected</em></p>
                  ) : (
                    <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                      {chosen.map((a) => (
                        <li key={a.id}>{a.authority_name} &lt;{a.official_email}&gt;</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                On a phone, tap "Open mail app" to use your Gmail app. Each authority gets a separate email from your own account (never one email with everyone in CC). Nothing is sent by Connect⁺: you press Send in your own mail app.
              </p>
              <p className="mt-2 rounded-xl border border-amber/20 bg-amber/5 p-3 text-xs leading-relaxed text-amber/90">
                I wanted to build automatic email sending here, but I did not have enough time. For now, please press Send in your own mail app. If you have time and the skills, you are very welcome to help build it:{" "}
                <Link href="/contributors#contribute" className="font-medium underline underline-offset-2">see how to contribute</Link>. Thank you for understanding. — Keshav, Developer
              </p>
              {chosen.length === 0 || !subject.trim() || !body.trim() ? (
                <p className="mt-3 text-sm text-amber/90">Enter the subject and body and choose at least one authority to enable sending.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {chosen.map((a) => {
                    const q = `to=${encodeURIComponent(a.official_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&${q}`;
                    const mailto = `mailto:${a.official_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    return (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
                        <span className="min-w-0 break-all">{a.authority_name}</span>
                        <span className="flex gap-2">
                          <a href={mailto} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan px-3 text-xs font-medium text-[#04121b] hover:bg-bright">
                            <Send className="h-3.5 w-3.5" aria-hidden="true" /> Open mail app
                          </a>
                          <a href={gmail} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-xs hover:bg-white/10">Gmail website</a>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {body.length > 1800 && (
                <p className="mt-2 text-xs text-amber/90">Long email: if the body is cut off in your mail app, copy it with the button below and paste it.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyButton variant="secondary" label="Copy email body" copiedLabel="Body copied" text={body} />
                <Button type="submit" variant="secondary">Save draft &amp; recipients</Button>
              </div>
              <p className="mt-2 text-xs text-white/40">Tip: send one email per authority, then save the draft so you can see who you contacted.</p>
            </section>
          </>
        )}
      </ActionForm>
    </div>
  );
}
