export type Tone = "neutral" | "cyan" | "amber" | "green" | "red" | "blue";

export const ISSUE_STATUSES: Record<string, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "cyan" },
  under_review: { label: "Under Review", tone: "blue" },
  campaign_active: { label: "Campaign Active", tone: "amber" },
  submitted_to_authority: { label: "Submitted to Authority", tone: "blue" },
  response_received: { label: "Response Received", tone: "cyan" },
  action_in_progress: { label: "Action In Progress", tone: "amber" },
  resolved: { label: "Resolved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  reopened: { label: "Reopened", tone: "red" },
};

// Statuses a moderator can set directly. Resolved/Reopened only come from the verified review flow.
export const STAFF_SETTABLE_STATUSES = [
  "open",
  "under_review",
  "campaign_active",
  "submitted_to_authority",
  "response_received",
  "action_in_progress",
  "rejected",
] as const;

export const EVIDENCE_STATUSES: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "amber" },
  verified: { label: "Verified", tone: "green" },
  unverified: { label: "Unverified", tone: "neutral" },
  link_unavailable: { label: "Link Unavailable", tone: "red" },
};

export const RESOLUTION_STATUSES: Record<string, { label: string; tone: Tone }> = {
  pending_verification: { label: "Pending Verification", tone: "amber" },
  verified: { label: "Verified", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "supported", label: "Most Supported" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently Updated" },
  { value: "resolved", label: "Resolved" },
] as const;

export const SUGGESTION_CATEGORIES: Record<string, string> = {
  ui_ux: "UI/UX Improvement",
  feature: "New Feature",
  performance: "Performance",
  accessibility: "Accessibility",
  general: "General Suggestion",
};

export const SUGGESTION_STATUSES: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "amber" },
  under_review: { label: "Under Review", tone: "blue" },
  accepted: { label: "Accepted", tone: "green" },
  planned: { label: "Planned", tone: "cyan" },
  implemented: { label: "Implemented", tone: "green" },
  declined: { label: "Declined", tone: "red" },
};

export const CONTRIBUTOR_ROLES: Record<string, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  design: "UI/UX Designer",
  security: "Security Contributor",
  testing: "Testing Contributor",
  documentation: "Documentation Contributor",
};

export const REPORT_STATUSES = ["open", "in_review", "resolved", "dismissed"] as const;

export const PAGE_SIZE = 12;
export const COMMENT_PAGE_SIZE = 20;

export const DEVELOPER = {
  name: "Keshav Sharma",
  role: "Developer",
  education: "Computer Science & Engineering Student, Government Engineering College, Jehanabad, Bihar",
  bio: "The creator of Connect⁺, building technology that empowers students to raise their concerns, unite for common causes, and drive meaningful change through collective action..",
  username: "k4hav",
  github: "https://github.com/k4hav",
  instagram: "https://www.instagram.com/k4hav/",
  x: "https://x.com/k4hav",
  telegram: "https://t.me/k4hav",
};