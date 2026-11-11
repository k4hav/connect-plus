import type { Metadata } from "next";
import { DiscordIcon, GithubIcon, InstagramIcon, TelegramIcon, XIcon } from "@/components/brand/SocialIcons";
import { DEVELOPER } from "@/lib/constants";
import { DISCORD_URL } from "@/lib/utils";

export const metadata: Metadata = { title: "Developer" };

export default function DeveloperPage() {
  const links = [
    { label: "GitHub", href: DEVELOPER.github, Icon: GithubIcon },
    { label: "Instagram", href: DEVELOPER.instagram, Icon: InstagramIcon },
    { label: "X", href: DEVELOPER.x, Icon: XIcon },
    { label: "Telegram", href: DEVELOPER.telegram, Icon: TelegramIcon },
    ...(DISCORD_URL ? [{ label: "Discord", href: DISCORD_URL, Icon: DiscordIcon }] : []),
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="glass-strong rounded-3xl p-6 sm:p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan to-electric text-2xl font-semibold text-[#04121b]" aria-hidden="true">KS</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{DEVELOPER.name}</h1>
        <p className="text-sm text-cyan">{DEVELOPER.role}</p>
        <p className="mt-1 text-sm text-muted">{DEVELOPER.education}</p>
        <p className="mt-4 leading-relaxed text-[#d4dbe6]">{DEVELOPER.bio}</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {links.map(({ label, href, Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm hover:bg-white/10">
                <Icon className="h-4 w-4" /> {label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
