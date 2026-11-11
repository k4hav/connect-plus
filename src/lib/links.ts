/** Returns a normalized http(s) URL or null. Rejects javascript:, data:, etc. */
export function parseHttpUrl(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export type Platform = "youtube" | "instagram" | "x" | "facebook" | "news" | "government" | "other";

const NEWS_HINTS = ["times", "news", "hindu", "tribune", "express", "today", "jagran", "bhaskar", "ndtv", "livehindustan", "prabhat"];

export function detectPlatform(url: string): Platform {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "other";
  }
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host === "x.com" || host.endsWith("twitter.com") || host === "t.co") return "x";
  if (host.endsWith("facebook.com") || host === "fb.watch") return "facebook";
  if (host.endsWith(".gov.in") || host.endsWith(".nic.in") || host.endsWith(".ac.in") || host.endsWith(".edu.in")) return "government";
  if (NEWS_HINTS.some((h) => host.includes(h))) return "news";
  return "other";
}

export const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  news: "News",
  government: "Official site",
  other: "Link",
};

/** Escapes characters that have meaning inside PostgREST .or()/.ilike() filters. */
export function safeSearch(q: string | undefined | null) {
  return (q ?? "").replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
