import { z } from "zod";
import { parseHttpUrl } from "@/lib/links";
import type { ActionState } from "@/lib/action-state";

const text = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters`).optional().transform((v) => (v ? v : undefined));

export const httpUrl = z
  .string()
  .trim()
  .refine((v) => parseHttpUrl(v) !== null, "Enter a valid http(s) link")
  .transform((v) => parseHttpUrl(v) as string);

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || parseHttpUrl(v) !== null, "Enter a valid http(s) link")
  .transform((v) => (v ? (parseHttpUrl(v) as string) : undefined));

const uuid = z.string().uuid("Invalid selection");

export const issueSchema = z.object({
  title: text(8, 140, "Title"),
  description: text(30, 5000, "Description"),
  category: z.string().trim().min(2, "Choose a category"),
  college_id: z.string().uuid("Choose a college"),
  location: optionalText(160),
});

export const commentSchema = z.object({ comment: text(1, 2000, "Comment") });

export const evidenceSchema = z.object({
  external_url: httpUrl,
  description: text(5, 500, "Description"),
});

export const resolutionSchema = z.object({
  resolution_summary: text(20, 3000, "Summary"),
  responsible_authority: text(2, 160, "Responsible authority"),
  resolution_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Choose a date"),
});

export const reopenSchema = z.object({
  reason: text(20, 1500, "Reason"),
  evidence_url: optionalUrl,
});

export const campaignSchema = z.object({
  issue_id: uuid,
  title: text(5, 120, "Title"),
  description: text(20, 3000, "Description"),
});

export const campaignUpdateSchema = z.object({ body: text(5, 1500, "Update") });

export const reportSchema = z.object({
  title: text(5, 140, "Title"),
  description: text(10, 3000, "Description"),
  steps_to_reproduce: optionalText(2000),
  expected_behavior: optionalText(1000),
  actual_behavior: optionalText(1000),
  page_url: optionalText(500),
  browser_info: optionalText(400),
});

export const abuseReportSchema = z.object({
  reason: text(10, 1000, "Reason"),
});

export const suggestionSchema = z.object({
  title: text(5, 140, "Title"),
  description: text(10, 3000, "Description"),
  category: z.enum(["ui_ux", "feature", "performance", "accessibility", "general"]),
  related_page: optionalText(200),
});

export const authoritySchema = z.object({
  authority_name: text(2, 160, "Name"),
  designation: optionalText(160),
  department: optionalText(160),
  official_email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  institution: optionalText(200),
  jurisdiction: optionalText(200),
  source_url: optionalUrl,
});

export const responseSchema = z.object({
  authority_name: text(2, 160, "Authority"),
  response_summary: text(10, 3000, "Summary"),
  response_date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Choose a date"),
  external_reference_url: optionalUrl,
});

export const emailDraftSchema = z.object({
  subject: text(3, 200, "Subject"),
  email_body: text(20, 10000, "Email body"),
});

/** Parses a FormData with a zod schema and returns either data or field errors. */
export function parseForm<S extends z.ZodTypeAny>(
  schema: S,
  formData: FormData,
): { data: z.infer<S>; errors?: undefined } | { data?: undefined; errors: NonNullable<ActionState["errors"]> } {
  const raw: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { errors };
}
