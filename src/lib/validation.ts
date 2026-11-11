import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    collegeId: z.string().uuid().optional().or(z.literal("")),
    branch: z.string().trim().max(80).optional(),
    academicYear: z.string().regex(/^[1-6]?$/, "Choose 1 to 6").optional(),
    terms: z.literal("on", { error: "Please accept the terms to continue" }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const otpSchema = z.object({
  email: emailSchema,
  token: z.string().trim().regex(/^\d{6,10}$/, "Enter the full code from your email"),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "3-30 characters: letters, numbers, underscore")
    .optional()
    .or(z.literal("")),
  college_id: z.string().uuid().optional().or(z.literal("")),
  course: z.string().trim().max(80).optional().or(z.literal("")),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  academic_year: z.coerce.number().int().min(1).max(6).optional().or(z.literal("").transform(() => undefined)),
  bio: z.string().trim().max(280, "Keep your bio under 280 characters").optional().or(z.literal("")),
});

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}