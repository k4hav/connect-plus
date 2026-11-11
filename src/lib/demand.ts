import { ISSUE_STATUSES, EVIDENCE_STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

type DemandIssue = {
  id: string;
  title: string;
  description: string;
  category_label?: string | null;
  college_name?: string | null;
  location?: string | null;
  status: string;
  support_count: number;
  published_at: string;
};

type DemandEvidence = { external_url: string; description: string; verification_status: string };

/**
 * The text a student pastes into ChatGPT/Gemini/Claude. It asks the AI for a formal email,
 * forbids invented facts, and labels evidence by its real verification status.
 */
export function buildDemandPrompt(issue: DemandIssue, evidence: DemandEvidence[] = [], siteUrl = ""): string {
  const lines: string[] = [];
  lines.push("You are helping a student write a formal, respectful email to a college or university authority.");
  lines.push("");
  lines.push("TASK");
  lines.push("Write a professional email (subject line + body) that raises the issue below and requests specific action.");
  lines.push("Use only the facts given here. Do not invent names, dates, numbers or promises. Leave [Your Name], [Roll No.] and [Branch / Year] as placeholders for me to fill in.");
  lines.push("Keep it polite, concise (under 250 words), and end with a clear request for a written reply and a timeframe.");
  lines.push("");
  lines.push("ISSUE");
  lines.push(`Title: ${issue.title}`);
  if (issue.category_label) lines.push(`Category: ${issue.category_label}`);
  if (issue.college_name) lines.push(`College: ${issue.college_name}`);
  if (issue.location) lines.push(`Location: ${issue.location}`);
  lines.push(`Reported on Connect⁺: ${fmtDate(issue.published_at)}`);
  lines.push(`Current status: ${ISSUE_STATUSES[issue.status]?.label ?? issue.status}`);
  lines.push(`Students who have supported this issue: ${issue.support_count} (support shows popularity, not verified fact)`);
  lines.push("");
  lines.push("DESCRIPTION");
  lines.push(issue.description);
  if (evidence.length) {
    lines.push("");
    lines.push("EXTERNAL EVIDENCE (mention only as links; the verification label is as recorded on Connect⁺)");
    evidence.forEach((e, i) => {
      lines.push(`${i + 1}. ${e.description} - ${e.external_url} [${EVIDENCE_STATUSES[e.verification_status]?.label ?? e.verification_status}]`);
    });
  }
  lines.push("");
  lines.push("WHAT I AM ASKING FOR");
  lines.push("[Describe the specific action you want, e.g. repair, a written clarification, a meeting.]");
  if (siteUrl) {
    lines.push("");
    lines.push(`Public issue page: ${siteUrl}/issues/${issue.id}`);
  }
  return lines.join("\n");
}
