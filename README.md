# Connect⁺ — Students Connect. Issues Matter.

Independent student-led civic-tech accountability platform. Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth, Postgres, RLS).
Created by Keshav Sharma. Not affiliated with any university or government body.

## 1. Setup

```bash
npm install
cp .env.example .env.local   # only KEY=value lines, nothing else
npm run dev
```

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`,
optional `NEXT_PUBLIC_GITHUB_REPO_URL`, `NEXT_PUBLIC_DISCORD_URL`. Never put a secret/service-role key in a `NEXT_PUBLIC_` var.

## 2. Database (Supabase → SQL Editor, in this order)

1. `supabase/migrations/0001_foundation.sql`
2. `supabase/migrations/0002_core.sql`
3. `supabase/seed.sql` (GEC Jehanabad only; no fake data)

Make yourself admin (after signing up once), in SQL editor:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL';
```

## 3. Supabase dashboard settings

- Authentication → URL Configuration: Site URL = your site (`http://localhost:3000` locally); Redirect URLs add `/auth/callback` and `/reset-password` for each origin.
- Authentication → Providers → Email: enable. "Confirm email" on = OTP/verification flow is used.
- Email templates (Confirm signup / Reset password): include `{{ .Token }}` for the 6-digit code, or link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
- Configure custom SMTP before going public (default Supabase mail is heavily rate-limited).

## 4. Deploy (Vercel)

Import the repo, set the env vars above (production `NEXT_PUBLIC_SITE_URL`), deploy, then add the production URL to Supabase redirect URLs.

## 5. Honest status

Implemented: auth, profiles, issues (support/follow/comments/moderation), evidence links, official responses, verified-resolution + reopen workflow, append-only history, campaigns, authority directory, Copy Demand + email draft workflow, notifications, developer/contributors/feedback/bug report/about, admin area.
Not implemented: **Gmail OAuth sending** (drafts only; Send is disabled), Cloudflare Turnstile. Database logic was tested locally on Postgres (PGlite); live Supabase flows must be verified on your project.
