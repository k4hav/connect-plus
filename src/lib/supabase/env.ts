// Supports the current "publishable key" name and the older "anon key" name.
// Literal property access is required so Next.js can inline NEXT_PUBLIC_* values.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const SUPABASE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;
