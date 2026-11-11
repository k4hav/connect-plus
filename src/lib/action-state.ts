export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors });
export const done = (message: string): ActionState => ({ ok: true, message });

/** Turns database errors into short student-friendly messages without leaking internals. */
export function dbMessage(error: { code?: string; message?: string } | null | undefined, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.message?.includes("Rate limit")) return "You are doing that too often. Please wait a while and try again.";
  if (error.code === "23505") return "That has already been recorded.";
  if (error.code === "42501" || error.code === "PGRST301") return error.message?.includes("resolved") || error.message?.includes("reopen")
    ? error.message
    : "You do not have permission to do that.";
  if (error.code === "23514") return "Some of the information is outside the allowed limits.";
  return fallback;
}
