<div align="center">

# Connect⁺

**Raise Your Voice Together.**

An independent, student-led civic-tech platform where students raise campus issues, gather support, reach the right authorities, and follow every issue until there is a **verified** outcome.

Built by [Keshav Sharma](https://github.com/k4hav) · Developer

</div>

> Connect⁺ is an independent student-led initiative and is not officially affiliated with any university or government body unless formal authorization is obtained.

---

## Table of contents

1. [What it does](#what-it-does)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Database](#database)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Supabase settings](#supabase-settings)
8. [Deploy on Vercel](#deploy-on-vercel)
9. [Scripts](#scripts)
10. [Security and design rules](#security-and-design-rules)
11. [Honest status and roadmap](#honest-status-and-roadmap)
12. [Contributing](#contributing)
13. [Note from the developer](#note-from-the-developer)

---

## What it does

- **Accounts:** email and password sign up with a code sent to the email, login with "remember me", forgot and reset password, profile with college, branch and year.
- **Issues:** raise, edit and browse issues with filters, sorting and pagination. One support per student, follow, comments, reports, moderation.
- **Evidence:** external links only (YouTube, Instagram, X, news, official sites). No file uploads. A link stays *Pending* until a moderator verifies it.
- **Copy Demand → email:** copy a ready prompt for any AI tool, paste the reviewed email, choose authorities, and open it in your own mail app. Nothing is sent by Connect⁺ itself.
- **Accountability:** official responses, resolution proposals with proof, moderator verification, reopen requests, and an append-only history for every issue.
- **Authority directory:** a contact is *Verified* only when it has a source URL and a date.
- **Campaigns:** organize supporters around an issue and post updates.
- **Community:** notifications, followed issues, activity, feedback and suggestions, bug reports, developer and contributors pages.
- **Admin area:** resolutions and reopen reviews, reports, authorities (with bulk import), contributors, suggestions, moderation logs.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3, custom "liquid glass" design system, framer-motion |
| Auth and database | Supabase (Auth, Postgres, Row Level Security) using `@supabase/ssr` |
| Validation | Zod 4 (server side and client side) |
| UI helpers | lucide-react, class-variance-authority, clsx, tailwind-merge |
| Hosting | Vercel |

## Project structure

```
connect-plus/
├── src/
│   ├── proxy.ts                 # Session refresh and route protection (Next.js 16 proxy)
│   ├── app/
│   │   ├── layout.tsx           # Root layout, metadata
│   │   ├── globals.css          # Design tokens, glass styles
│   │   ├── (auth)/              # login, register, verify, forgot-password
│   │   ├── auth/callback/       # Email link and PKCE code exchange
│   │   ├── reset-password/
│   │   └── (app)/               # Everything behind the app shell
│   │       ├── dashboard/       issues/ (list, new, [id], [id]/edit, [id]/email)
│   │       ├── campaigns/       authorities/       notifications/
│   │       ├── activity/        followed/          profile/
│   │       ├── about/           developer/         contributors/
│   │       ├── feedback/        report-bug/
│   │       └── admin/           # Staff only: resolutions, reports, authorities,
│   │                            # contributors, suggestions, logs
│   ├── components/
│   │   ├── ui/                  # Button, Input, Select, ActionForm, Badge, ...
│   │   ├── auth/                # Blade-style auth switch, OTP form, ...
│   │   ├── issues/              # IssueCard, IssueForm, EmailWorkflow, detail/*
│   │   ├── campaigns/  community/  brand/  shell/ (Sidebar, Header, Footer)
│   └── lib/
│       ├── supabase/            # browser, server and proxy clients
│       ├── actions/             # Server Actions (issues, discussion, accountability,
│       │                        #   campaigns, community, admin)
│       ├── data/                # Server-side data helpers
│       ├── schemas.ts  validation.ts  constants.ts  demand.ts  links.ts  ...
├── supabase/
│   ├── migrations/              # 0001 to 0005, run in order
│   ├── seed.sql                 # Reference data only, no fake content
│   ├── check_setup.sql          # Shows what is missing in your database
│   └── authority_import_template.txt
├── DEPLOY.md                    # Step-by-step setup and deploy guide
├── .env.example
└── package.json
```

## Database

All tables use Row Level Security. The important design choices:

- Counters (supports, comments) are maintained by database triggers and cannot be edited by clients.
- An issue can become **Resolved** only through a verified resolution, and **Reopened** only through an approved request, both via database functions.
- Issue history and moderation logs are append-only.
- Rate limits and ownership guards are enforced in the database.
- "Verified" always requires a source URL and a verification date.

Run these in **Supabase → SQL Editor**, in this order:

| File | Purpose |
|---|---|
| `0001_foundation.sql` | Profiles, admin roles, signup trigger |
| `0002_core.sql` | Issues, evidence, responses, resolutions, campaigns, notifications, RLS, views |
| `0003_bihar_colleges_and_custom_reference.sql` | Bihar / BEU colleges, add-your-own college and category |
| `0004_security_advisor_fixes.sql` | Supabase Security Advisor fixes |
| `0005_verified_authorities.sql` | Authority contacts copied from official pages, each with its source |
| `seed.sql` | Reference data |

Use `supabase/check_setup.sql` to see which parts are missing. To make yourself an admin after your first sign up:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL';
```

## Getting started

```bash
git clone https://github.com/k4hav/connect-plus.git
cd connect-plus
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

## Environment variables

Only plain `KEY=value` lines go in `.env.local`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | The publishable (public) key only |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` locally, your Vercel URL in production |
| `NEXT_PUBLIC_OTP_LENGTH` | No | Must match Supabase "Email OTP Length" (default 8) |
| `NEXT_PUBLIC_GITHUB_REPO_URL` | No | Shows GitHub links in the app |
| `NEXT_PUBLIC_DISCORD_URL` | No | Shows a Discord link on the Developer page |

**Never** put a service-role or secret key in any `NEXT_PUBLIC_` variable or in the repository.

## Supabase settings

1. **Authentication → URL Configuration:** set Site URL, and add `http://localhost:3000/**` and your production URL with `/**` to Redirect URLs.
2. **Authentication → Providers → Email:** enabled, "Confirm email" on.
3. **Emails → Templates → Confirm sign up:** use `{{ .Token }}` so the email contains the code (full template in `DEPLOY.md`).
4. **Custom SMTP** is required to edit templates and to send more than a few emails per hour.

## Deploy on Vercel

1. Push the repository to GitHub.
2. On [vercel.com](https://vercel.com) choose **Add New → Project** and import the repository. Framework: Next.js (auto).
3. Add the environment variables from the table above, then **Deploy**.
4. Copy the live URL into Supabase (Site URL and Redirect URLs) and into `NEXT_PUBLIC_SITE_URL`, then **Redeploy**.

Full walkthrough: [`DEPLOY.md`](./DEPLOY.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npx tsc --noEmit` | Type-check the project |

## Security and design rules

- Server code uses `supabase.auth.getUser()` (verified), never an unverified session.
- Every server action re-checks the user and validates input with Zod. The database re-checks everything again through RLS.
- External links are validated (`http`/`https` only) and rendered with `rel="noopener noreferrer nofollow"`.
- Verification states are never faked: evidence is *Pending* until verified, and a response is *Verified* only with a reference link.
- The app never claims an email was delivered or read.

## Honest status and roadmap

Implemented and covered by local database tests: schema, RLS, triggers, resolution and reopen workflow, history, notifications, rate limits.

Not implemented yet:
- **Automated email sending** (Gmail OAuth). For now the student presses Send in their own mail app.
- A fuller verified directory of BEU and college authorities.
- Sign in with Google.
- Bot protection on sign up (Cloudflare Turnstile).
- Automated test suite for the web app.

## Contributing

Contributions of every size are welcome: code, design, testing, ideas, bug reports. See the **Contributors** page in the app (or `src/components/community/ContributeGuide.tsx`) for the step-by-step guide.

Quick version: fork → clone → set up your own free Supabase project (run the migrations) → create a branch → run `npx tsc --noEmit` and `npm run build` → open a Pull Request.

Ground rules: no secrets in code, no fake data or fake verification, Row Level Security on every table, be kind.

## Note from the developer

I wanted Connect⁺ to send emails to authorities automatically from a student's own Gmail account. I am a student building this alone with limited time, so for now the email step is a shortcut: you write the email, choose authorities, and open it in Gmail with one click. Nothing is sent without the student's approval.

Automated sending is on the roadmap. If you can build it safely (Google OAuth, `gmail.send` scope, encrypted tokens, one separate email per authority, explicit confirmation), please contribute. Every contribution is respected and welcome.

— Keshav Sharma, Developer
