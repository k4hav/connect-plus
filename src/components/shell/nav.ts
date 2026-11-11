import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Megaphone,
  Activity,
  Bookmark,
  Landmark,
  Bell,
  User,
  Info,
  Bug,
  Code2,
  Users,
  Lightbulb,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Opens GitHub; rendered disabled when the repository URL is not configured. */
  github?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/issues", label: "Explore Issues", icon: Compass },
      { href: "/issues/new", label: "Raise an Issue", icon: PlusCircle },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    title: "My Space",
    items: [
      { href: "/activity", label: "My Activity", icon: Activity },
      { href: "/followed", label: "Followed Issues", icon: Bookmark },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/profile", label: "Profile", icon: User },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/authorities", label: "Authority Directory", icon: Landmark },
      { href: "/about", label: "About Connect⁺", icon: Info },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/developer", label: "Developer", icon: Code2 },
      { href: "/contributors", label: "Contributors", icon: Users },
      { href: "/feedback", label: "Feedback & Suggestions", icon: Lightbulb },
      { href: "/report-bug", label: "Report a Bug", icon: Bug },
      { href: "#github", label: "Contribute on GitHub", icon: Code2, github: true },
    ],
  },
];

export const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin", icon: ShieldCheck };
