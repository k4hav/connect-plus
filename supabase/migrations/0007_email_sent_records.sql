-- 0007: public record of who emailed which authority about an issue.
-- Connect+ never sends email itself, so a student confirms "I sent it" and the count becomes visible to everyone.
-- Safe to run more than once.

create table if not exists public.email_sent (
  id              uuid primary key default gen_random_uuid(),
  issue_id        uuid not null references public.issues (id) on delete cascade,
  sent_by         uuid not null references public.profiles (id) on delete cascade,
  recipient_email text not null check (char_length(recipient_email) between 5 and 200 and position('@' in recipient_email) > 1),
  recipient_name  text check (recipient_name is null or char_length(recipient_name) <= 150),
  authority_id    uuid references public.authority_directory (id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (issue_id, sent_by, recipient_email)
);

create index if not exists email_sent_issue_idx on public.email_sent (issue_id, created_at desc);

alter table public.email_sent enable row level security;

drop policy if exists "everyone sees email records" on public.email_sent;
create policy "everyone sees email records" on public.email_sent for select to authenticated
  using (public.can_see_issue(issue_id));

drop policy if exists "record own email" on public.email_sent;
create policy "record own email" on public.email_sent for insert to authenticated
  with check (sent_by = (select auth.uid()) and public.can_see_issue(issue_id));

drop policy if exists "undo own email" on public.email_sent;
create policy "undo own email" on public.email_sent for delete to authenticated
  using (sent_by = (select auth.uid()));

grant select, insert, delete on public.email_sent to authenticated;
