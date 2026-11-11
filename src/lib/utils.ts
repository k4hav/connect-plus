import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const GITHUB_PROFILE_URL = "https://github.com/k4hav";
export const GITHUB_REPO_URL = process.env.NEXT_PUBLIC_GITHUB_REPO_URL?.trim() || "";

export const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL?.trim() || "";
