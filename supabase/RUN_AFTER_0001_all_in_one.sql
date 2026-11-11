-- RUN AFTER 0001: 0002 + 0003 + seed in one go. Use only if check_setup.sql shows 0002 missing.
-- Connect+ core schema (Phases 3-4): tables, triggers, RPCs, RLS.
-- Depends on 0001_foundation.sql (profiles, admin_roles, is_staff(), is_admin(), set_updated_at()).
-- Nothing here drops or rewrites existing data.

------------------------------------------------------------------------------
-- Shared helpers
------------------------------------------------------------------------------
create or replace function public.forbid_modification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only; add a new event instead of changing history', tg_table_name
    using errcode = '42501';
end;
$$;

-- Per-user insert throttle. Runs as the caller, so it only throttles API clients
-- (anon/authenticated); SQL editor and service-role writes are never throttled.
-- args: owner column, max rows, window minutes, timestamp column
create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid;
  v_count int;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  v_owner := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if v_owner is null then
    return new;
  end if;
  execute format(
    'select count(*) from %I.%I where %I = $1 and %I > now() - make_interval(mins => $2)',
    tg_table_schema, tg_table_name, tg_argv[0], tg_argv[3]
  ) into v_count using v_owner, tg_argv[2]::int;
  if v_count >= tg_argv[1]::int then
    raise exception 'Rate limit reached. Please wait a while before trying again.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

------------------------------------------------------------------------------
-- Reference data: categories and colleges
------------------------------------------------------------------------------
create table public.categories (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  label       text not null check (char_length(label) between 2 and 60),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.categories (slug, label, sort_order) values
  ('infrastructure', 'Infrastructure', 1),
  ('examination', 'Examination', 2),
  ('results', 'Results', 3),
  ('academic', 'Academic', 4),
  ('faculty', 'Faculty', 5),
  ('hostel', 'Hostel', 6),
  ('transport', 'Transport', 7),
  ('fees', 'Fees', 8),
  ('scholarships', 'Scholarships', 9),
  ('safety', 'Safety', 10),
  ('administration', 'Administration', 11),
  ('other', 'Other', 12);

create table public.colleges (
  id              uuid primary key default gen_random_uuid(),
  college_name    text not null check (char_length(college_name) between 3 and 160),
  university_name text not null check (char_length(university_name) between 2 and 160),
  location        text check (location is null or char_length(location) <= 160),
  district        text check (district is null or char_length(district) <= 80),
  state           text check (state is null or char_length(state) <= 80),
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (college_name, university_name)
);

-- profiles: extend (old free-text college/university columns stay for compatibility)
alter table public.profiles
  add column college_id  uuid references public.colleges (id) on delete set null,
  add column username    text,
  add column avatar_url  text,
  add column course      text,
  add column bio         text;

alter table public.profiles
  add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  add constraint profiles_avatar_https check (avatar_url is null or (avatar_url ~* '^https://' and char_length(avatar_url) <= 500)),
  add constraint profiles_course_len check (course is null or char_length(course) <= 80),
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 280);

create unique index profiles_username_key on public.profiles (lower(username)) where username is not null;
create index profiles_college_idx on public.profiles (college_id);

-- Signup trigger now also copies the optional registration fields (validated, never trusted blindly).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name    text := left(trim(coalesce(meta ->> 'full_name', '')), 80);
  v_college uuid;
  v_year    smallint;
  v_branch  text := left(nullif(trim(coalesce(meta ->> 'branch', '')), ''), 80);
begin
  begin
    v_college := nullif(meta ->> 'college_id', '')::uuid;
  exception when others then
    v_college := null;
  end;
  if v_college is not null and not exists (select 1 from public.colleges where id = v_college) then
    v_college := null;
  end if;

  begin
    v_year := nullif(meta ->> 'academic_year', '')::smallint;
  exception when others then
    v_year := null;
  end;
  if v_year is not null and (v_year < 1 or v_year > 6) then
    v_year := null;
  end if;

  if char_length(v_name) < 2 then
    v_name := 'Student';
  end if;

  insert into public.profiles (id, full_name, college_id, branch, academic_year)
  values (new.id, v_name, v_college, v_branch, v_year);
  return new;
end;
$$;

------------------------------------------------------------------------------
-- Issues
------------------------------------------------------------------------------
create table public.issues (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 8 and 140),
  description      text not null check (char_length(description) between 30 and 5000),
  category         text not null references public.categories (slug),
  college_id       uuid not null references public.colleges (id) on delete restrict,
  location         text check (location is null or char_length(location) <= 160),
  created_by       uuid references public.profiles (id) on delete set null,
  status           text not null default 'open' check (status in (
                     'open', 'under_review', 'campaign_active', 'submitted_to_authority',
                     'response_received', 'action_in_progress', 'resolved', 'rejected', 'reopened')),
  priority         text check (priority is null or priority in ('low', 'medium', 'high')),
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'hidden')),
  support_count    int not null default 0 check (support_count >= 0),
  comment_count    int not null default 0 check (comment_count >= 0),
  published_at     timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index issues_status_idx on public.issues (status);
create index issues_category_idx on public.issues (category);
create index issues_college_idx on public.issues (college_id);
create index issues_created_by_idx on public.issues (created_by);
create index issues_published_idx on public.issues (published_at desc);
create index issues_support_idx on public.issues (support_count desc);
create index issues_activity_idx on public.issues (last_activity_at desc);

create trigger issues_set_updated_at before update on public.issues
  for each row execute function public.set_updated_at();

create table public.issue_likes (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);
create index issue_likes_user_idx on public.issue_likes (user_id);

create table public.issue_follows (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);
create index issue_follows_user_idx on public.issue_follows (user_id);

create table public.issue_comments (
  id                uuid primary key default gen_random_uuid(),
  issue_id          uuid not null references public.issues (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  comment           text not null check (char_length(comment) between 1 and 2000),
  parent_comment_id uuid references public.issue_comments (id) on delete cascade,
  moderation_status text not null default 'visible' check (moderation_status in ('visible', 'hidden', 'removed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index issue_comments_issue_idx on public.issue_comments (issue_id, created_at);
create index issue_comments_user_idx on public.issue_comments (user_id);
create trigger issue_comments_set_updated_at before update on public.issue_comments
  for each row execute function public.set_updated_at();

create table public.issue_evidence (
  id                  uuid primary key default gen_random_uuid(),
  issue_id            uuid not null references public.issues (id) on delete cascade,
  submitted_by        uuid references public.profiles (id) on delete set null,
  external_url        text not null check (external_url ~* '^https?://' and char_length(external_url) <= 2048),
  platform            text not null default 'other' check (platform in (
                        'youtube', 'instagram', 'x', 'facebook', 'news', 'government', 'other')),
  description         text not null check (char_length(description) between 5 and 500),
  verification_status text not null default 'pending' check (verification_status in (
                        'pending', 'verified', 'unverified', 'link_unavailable')),
  moderator_note      text check (moderator_note is null or char_length(moderator_note) <= 500),
  submitted_at        timestamptz not null default now(),
  verified_at         timestamptz,
  verified_by         uuid references public.profiles (id) on delete set null
);
create index issue_evidence_issue_idx on public.issue_evidence (issue_id);
create index issue_evidence_status_idx on public.issue_evidence (verification_status);

-- Append-only accountability log. actor_id is a plain uuid (no FK) so account deletion can never rewrite history.
create table public.issue_history (
  id                uuid primary key default gen_random_uuid(),
  issue_id          uuid not null references public.issues (id) on delete restrict,
  actor_id          uuid,
  event_type        text not null check (event_type in (
                      'issue_created', 'issue_edited', 'issue_published', 'status_changed',
                      'support_added', 'support_removed', 'campaign_started', 'email_attempted',
                      'official_response_recorded', 'evidence_submitted', 'evidence_verified',
                      'resolution_proposed', 'resolution_verified', 'resolution_rejected',
                      'issue_resolved', 'reopen_requested', 'issue_reopened', 'moderation_action')),
  event_description text not null,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);
create index issue_history_issue_idx on public.issue_history (issue_id, created_at desc);
create index issue_history_created_idx on public.issue_history (created_at desc);

create trigger issue_history_append_only
  before update or delete on public.issue_history
  for each row execute function public.forbid_modification();

------------------------------------------------------------------------------
-- Authorities
------------------------------------------------------------------------------
create table public.authority_directory (
  id                  uuid primary key default gen_random_uuid(),
  authority_name      text not null check (char_length(authority_name) between 2 and 160),
  designation         text check (designation is null or char_length(designation) <= 160),
  department          text check (department is null or char_length(department) <= 160),
  official_email      text not null check (official_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(official_email) <= 254),
  institution         text check (institution is null or char_length(institution) <= 200),
  jurisdiction        text check (jurisdiction is null or char_length(jurisdiction) <= 200),
  source_url          text check (source_url is null or (source_url ~* '^https?://' and char_length(source_url) <= 2048)),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'pending', 'verified')),
  last_verified_at    timestamptz,
  is_active           boolean not null default true,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- "Verified" must always be backed by a source and a verification date.
  constraint authority_verified_needs_source check (
    verification_status <> 'verified' or (source_url is not null and last_verified_at is not null)
  )
);
create index authority_name_idx on public.authority_directory (lower(authority_name));
create index authority_active_idx on public.authority_directory (is_active, verification_status);
create trigger authority_set_updated_at before update on public.authority_directory
  for each row execute function public.set_updated_at();

create table public.issue_recipients (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references public.issues (id) on delete cascade,
  authority_id uuid not null references public.authority_directory (id) on delete restrict,
  selected_by uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (issue_id, authority_id, selected_by)
);

------------------------------------------------------------------------------
-- Email (schema only; Gmail OAuth is a later phase and runs server-side)
------------------------------------------------------------------------------
create table public.email_connections (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  provider                text not null default 'gmail' check (provider in ('gmail')),
  provider_email          text not null,
  encrypted_refresh_token text not null,
  connection_status       text not null default 'connected' check (connection_status in ('connected', 'revoked', 'error')),
  connected_at            timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.email_campaigns (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  subject    text not null check (char_length(subject) between 3 and 200),
  email_body text not null check (char_length(email_body) between 20 and 10000),
  status     text not null default 'draft' check (status in ('draft', 'ready', 'sending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);
create index email_campaigns_issue_idx on public.email_campaigns (issue_id);
create index email_campaigns_user_idx on public.email_campaigns (created_by);

create table public.email_logs (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.email_campaigns (id) on delete cascade,
  recipient_id        uuid not null references public.authority_directory (id) on delete restrict,
  sender_id           uuid not null references public.profiles (id) on delete cascade,
  -- Gmail acceptance is NOT delivery; there is deliberately no 'delivered' or 'read' state.
  attempt_status      text not null default 'pending' check (attempt_status in ('pending', 'accepted_by_gmail_api', 'failed')),
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index email_logs_campaign_idx on public.email_logs (campaign_id);

------------------------------------------------------------------------------
-- Official responses and resolution workflow
------------------------------------------------------------------------------
create table public.official_responses (
  id                     uuid primary key default gen_random_uuid(),
  issue_id               uuid not null references public.issues (id) on delete cascade,
  authority_name         text not null check (char_length(authority_name) between 2 and 160),
  response_summary       text not null check (char_length(response_summary) between 10 and 3000),
  response_date          date not null,
  external_reference_url text check (external_reference_url is null or (external_reference_url ~* '^https?://' and char_length(external_reference_url) <= 2048)),
  verification_status    text not null default 'pending' check (verification_status in ('pending', 'verified', 'unverified')),
  recorded_by            uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now()
);
create index official_responses_issue_idx on public.official_responses (issue_id, created_at desc);

create table public.issue_resolutions (
  id                    uuid primary key default gen_random_uuid(),
  issue_id              uuid not null references public.issues (id) on delete cascade,
  proposed_by           uuid references public.profiles (id) on delete set null,
  resolution_summary    text not null check (char_length(resolution_summary) between 20 and 3000),
  responsible_authority text not null check (char_length(responsible_authority) between 2 and 160),
  resolution_date       date not null,
  verification_status   text not null default 'pending_verification' check (verification_status in (
                          'pending_verification', 'verified', 'rejected')),
  review_note           text check (review_note is null or char_length(review_note) <= 500),
  verified_by           uuid references public.profiles (id) on delete set null,
  verified_at           timestamptz,
  created_at            timestamptz not null default now()
);
create index issue_resolutions_issue_idx on public.issue_resolutions (issue_id, created_at desc);
create index issue_resolutions_status_idx on public.issue_resolutions (verification_status);

create table public.resolution_evidence (
  id                  uuid primary key default gen_random_uuid(),
  resolution_id       uuid not null references public.issue_resolutions (id) on delete cascade,
  external_url        text not null check (external_url ~* '^https?://' and char_length(external_url) <= 2048),
  description         text not null check (char_length(description) between 5 and 500),
  verification_status text not null default 'pending' check (verification_status in (
                        'pending', 'verified', 'unverified', 'link_unavailable')),
  created_at          timestamptz not null default now()
);
create index resolution_evidence_idx on public.resolution_evidence (resolution_id);

create table public.reopen_requests (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null references public.issues (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  reason       text not null check (char_length(reason) between 20 and 1500),
  evidence_url text check (evidence_url is null or (evidence_url ~* '^https?://' and char_length(evidence_url) <= 2048)),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note  text check (review_note is null or char_length(review_note) <= 500),
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index reopen_requests_issue_idx on public.reopen_requests (issue_id);
create index reopen_requests_status_idx on public.reopen_requests (status);

------------------------------------------------------------------------------
-- Campaigns
------------------------------------------------------------------------------
create table public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  issue_id        uuid not null references public.issues (id) on delete restrict,
  title           text not null check (char_length(title) between 5 and 120),
  description     text not null check (char_length(description) between 20 and 3000),
  status          text not null default 'active' check (status in ('active', 'paused', 'completed', 'closed')),
  start_date      date not null default current_date,
  external_links  jsonb not null default '[]'::jsonb check (jsonb_typeof(external_links) = 'array' and jsonb_array_length(external_links) <= 5),
  supporter_count int not null default 0 check (supporter_count >= 0),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index campaigns_issue_idx on public.campaigns (issue_id);
create index campaigns_status_idx on public.campaigns (status, created_at desc);
create trigger campaigns_set_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_supporters (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create table public.campaign_updates (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null check (char_length(body) between 5 and 1500),
  created_at  timestamptz not null default now()
);
create index campaign_updates_idx on public.campaign_updates (campaign_id, created_at desc);

------------------------------------------------------------------------------
-- Community: contributors, suggestions, reports, notifications, moderation
------------------------------------------------------------------------------
create table public.contributors (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null check (char_length(name) between 2 and 80),
  github_username          text check (github_username is null or github_username ~ '^[A-Za-z0-9-]{1,39}$'),
  github_profile_url       text check (github_profile_url is null or github_profile_url ~* '^https://github\.com/'),
  avatar_url               text check (avatar_url is null or avatar_url ~* '^https://'),
  contribution_role        text not null check (contribution_role in (
                             'frontend', 'backend', 'design', 'security', 'testing', 'documentation')),
  contribution_description text check (contribution_description is null or char_length(contribution_description) <= 400),
  approval_status          text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_by              uuid references public.profiles (id) on delete set null,
  created_at               timestamptz not null default now()
);

create table public.suggestions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (char_length(title) between 5 and 140),
  description  text not null check (char_length(description) between 10 and 3000),
  category     text not null check (category in ('ui_ux', 'feature', 'performance', 'accessibility', 'general')),
  related_page text check (related_page is null or char_length(related_page) <= 200),
  status       text not null default 'pending' check (status in (
                 'pending', 'under_review', 'accepted', 'planned', 'implemented', 'declined')),
  admin_note   text check (admin_note is null or char_length(admin_note) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index suggestions_user_idx on public.suggestions (user_id);
create trigger suggestions_set_updated_at before update on public.suggestions
  for each row execute function public.set_updated_at();

create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles (id) on delete set null,
  report_type        text not null default 'bug' check (report_type in ('bug', 'abuse', 'spam', 'other')),
  target_type        text check (target_type is null or target_type in ('issue', 'comment', 'evidence', 'campaign')),
  target_id          uuid,
  title              text not null check (char_length(title) between 5 and 140),
  description        text not null check (char_length(description) between 10 and 3000),
  steps_to_reproduce text check (steps_to_reproduce is null or char_length(steps_to_reproduce) <= 2000),
  expected_behavior  text check (expected_behavior is null or char_length(expected_behavior) <= 1000),
  actual_behavior    text check (actual_behavior is null or char_length(actual_behavior) <= 1000),
  page_url           text check (page_url is null or char_length(page_url) <= 500),
  browser_info       text check (browser_info is null or char_length(browser_info) <= 400),
  status             text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  created_at         timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_user_idx on public.reports (user_id);

create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  message           text not null,
  notification_type text not null check (notification_type in (
                      'comment', 'status_change', 'official_response', 'resolution',
                      'campaign_update', 'moderation', 'email_result', 'suggestion')),
  related_issue_id  uuid references public.issues (id) on delete cascade,
  is_read           boolean not null default false,
  created_at        timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.moderation_logs (
  id           uuid primary key default gen_random_uuid(),
  moderator_id uuid,
  target_type  text not null,
  target_id    uuid,
  action       text not null,
  reason       text check (reason is null or char_length(reason) <= 500),
  created_at   timestamptz not null default now()
);
create index moderation_logs_created_idx on public.moderation_logs (created_at desc);
create trigger moderation_logs_append_only
  before update or delete on public.moderation_logs
  for each row execute function public.forbid_modification();

------------------------------------------------------------------------------
-- Internal event / notification helpers (not callable by API clients)
------------------------------------------------------------------------------
create or replace function public.log_event(
  p_issue uuid, p_actor uuid, p_type text, p_description text, p_meta jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.issue_history (issue_id, actor_id, event_type, event_description, metadata)
  values (p_issue, p_actor, p_type, p_description, coalesce(p_meta, '{}'::jsonb));
  update public.issues set last_activity_at = now() where id = p_issue;
end;
$$;

create or replace function public.notify_user(
  p_user uuid, p_issue uuid, p_title text, p_message text, p_type text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user is null then
    return;
  end if;
  insert into public.notifications (user_id, title, message, notification_type, related_issue_id)
  values (p_user, p_title, p_message, p_type, p_issue);
end;
$$;

create or replace function public.notify_followers(
  p_issue uuid, p_exclude uuid, p_title text, p_message text, p_type text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, title, message, notification_type, related_issue_id)
  select f.user_id, p_title, p_message, p_type, p_issue
  from public.issue_follows f
  where f.issue_id = p_issue and (p_exclude is null or f.user_id <> p_exclude);
end;
$$;

revoke all on function public.log_event(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.notify_user(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.notify_followers(uuid, uuid, text, text, text) from public, anon, authenticated;

-- Visibility helper: runs as the caller, so it inherits the issues RLS policy.
create or replace function public.can_see_issue(p_issue uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from public.issues i where i.id = p_issue);
$$;

------------------------------------------------------------------------------
-- Guard triggers (run as the caller)
------------------------------------------------------------------------------
create or replace function public.guard_issue_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_last_reopen timestamptz;
begin
  if current_user in ('anon', 'authenticated') then
    if new.id is distinct from old.id
       or new.created_by is distinct from old.created_by
       or new.support_count is distinct from old.support_count
       or new.comment_count is distinct from old.comment_count
       or new.published_at is distinct from old.published_at
       or new.last_activity_at is distinct from old.last_activity_at then
      raise exception 'Counters, ownership and timestamps cannot be edited directly' using errcode = '42501';
    end if;
    if not public.is_staff() and (
         new.status is distinct from old.status
         or new.moderation_status is distinct from old.moderation_status
         or new.priority is distinct from old.priority
         or new.college_id is distinct from old.college_id) then
      raise exception 'Only moderators can change status, visibility or priority' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    select max(created_at) into v_last_reopen
    from public.issue_history where issue_id = new.id and event_type = 'issue_reopened';

    if new.status = 'resolved' and not exists (
      select 1 from public.issue_resolutions r
      where r.issue_id = new.id and r.verification_status = 'verified'
        and (v_last_reopen is null or r.verified_at > v_last_reopen)
    ) then
      raise exception 'An issue can only be resolved after a moderator verifies a resolution' using errcode = '42501';
    end if;

    if new.status = 'reopened' and not (old.status = 'resolved' and exists (
      select 1 from public.reopen_requests q
      where q.issue_id = new.id and q.status = 'approved'
        and (v_last_reopen is null or q.reviewed_at > v_last_reopen)
    )) then
      raise exception 'An issue can only be reopened after a moderator approves a reopen request' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger issues_guard before update on public.issues
  for each row execute function public.guard_issue_update();

create or replace function public.guard_issue_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.status := 'open';
    new.moderation_status := 'visible';
    new.priority := null;
    new.support_count := 0;
    new.comment_count := 0;
    new.published_at := now();
    new.last_activity_at := now();
  end if;
  return new;
end;
$$;
create trigger issues_guard_insert before insert on public.issues
  for each row execute function public.guard_issue_insert();

create or replace function public.guard_comment_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.id is distinct from old.id or new.issue_id is distinct from old.issue_id
       or new.user_id is distinct from old.user_id or new.parent_comment_id is distinct from old.parent_comment_id then
      raise exception 'Comment ownership cannot be changed' using errcode = '42501';
    end if;
    if not public.is_staff() and new.moderation_status is distinct from old.moderation_status then
      raise exception 'Only moderators can moderate comments' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger comments_guard before update on public.issue_comments
  for each row execute function public.guard_comment_update();

create or replace function public.guard_campaign_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.supporter_count is distinct from old.supporter_count
       or new.created_by is distinct from old.created_by or new.issue_id is distinct from old.issue_id then
      raise exception 'Counters and ownership cannot be edited directly' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger campaigns_guard before update on public.campaigns
  for each row execute function public.guard_campaign_update();

create or replace function public.guard_insert_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Clients may never choose moderation fields or counters on insert.
  if current_user in ('anon', 'authenticated') then
    if tg_table_name = 'campaigns' then
      new.supporter_count := 0;
    elsif tg_table_name = 'issue_comments' then
      new.moderation_status := 'visible';
    end if;
  end if;
  return new;
end;
$$;
create trigger campaigns_guard_insert before insert on public.campaigns
  for each row execute function public.guard_insert_defaults();
create trigger comments_guard_insert before insert on public.issue_comments
  for each row execute function public.guard_insert_defaults();

-- Rate limits (API clients only)
create trigger issues_rate_limit before insert on public.issues
  for each row execute function public.enforce_rate_limit('created_by', '5', '60', 'created_at');
create trigger comments_rate_limit before insert on public.issue_comments
  for each row execute function public.enforce_rate_limit('user_id', '20', '10', 'created_at');
create trigger evidence_rate_limit before insert on public.issue_evidence
  for each row execute function public.enforce_rate_limit('submitted_by', '15', '60', 'submitted_at');
create trigger campaigns_rate_limit before insert on public.campaigns
  for each row execute function public.enforce_rate_limit('created_by', '3', '60', 'created_at');
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.enforce_rate_limit('user_id', '10', '60', 'created_at');
create trigger suggestions_rate_limit before insert on public.suggestions
  for each row execute function public.enforce_rate_limit('user_id', '5', '60', 'created_at');

------------------------------------------------------------------------------
-- Event / counter / notification triggers (security definer)
------------------------------------------------------------------------------
create or replace function public.t_issue_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_event(new.id, new.created_by, 'issue_created', 'Issue created and published',
    jsonb_build_object('title', new.title, 'category', new.category));
  if new.created_by is not null then
    insert into public.issue_follows (issue_id, user_id) values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger issues_after_insert after insert on public.issues
  for each row execute function public.t_issue_insert();

create or replace function public.t_issue_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if new.title is distinct from old.title or new.description is distinct from old.description
     or new.category is distinct from old.category or new.location is distinct from old.location then
    perform public.log_event(new.id, v_actor, 'issue_edited', 'Issue details edited',
      jsonb_build_object('title_changed', new.title is distinct from old.title,
                         'description_changed', new.description is distinct from old.description));
  end if;

  if new.status is distinct from old.status then
    perform public.log_event(new.id, v_actor, 'status_changed',
      'Status changed from ' || old.status || ' to ' || new.status,
      jsonb_build_object('from', old.status, 'to', new.status));
    if new.status = 'resolved' then
      perform public.log_event(new.id, v_actor, 'issue_resolved', 'Issue marked resolved after moderator verification', '{}'::jsonb);
    elsif new.status = 'reopened' then
      perform public.log_event(new.id, v_actor, 'issue_reopened', 'Issue reopened after moderator approval', '{}'::jsonb);
    end if;
    perform public.notify_followers(new.id, null, 'Status updated: ' || left(new.title, 80),
      'Status is now ' || replace(new.status, '_', ' ') || '.', 'status_change');
  end if;

  if new.moderation_status is distinct from old.moderation_status then
    if new.moderation_status = 'visible' then
      perform public.log_event(new.id, v_actor, 'issue_published', 'Issue made visible again by a moderator', '{}'::jsonb);
    else
      perform public.log_event(new.id, v_actor, 'moderation_action', 'Issue hidden by a moderator', '{}'::jsonb);
      perform public.notify_user(new.created_by, new.id, 'Your issue was hidden',
        'A moderator hid "' || left(new.title, 80) || '". You can contact the team via Feedback.', 'moderation');
    end if;
  end if;
  return new;
end;
$$;
create trigger issues_after_update after update on public.issues
  for each row execute function public.t_issue_update();

create or replace function public.t_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_issue uuid := coalesce(new.issue_id, old.issue_id);
begin
  update public.issues
  set support_count = (select count(*) from public.issue_likes where issue_id = v_issue)
  where id = v_issue;
  if tg_op = 'INSERT' then
    perform public.log_event(v_issue, new.user_id, 'support_added', 'A student added their support', '{}'::jsonb);
  else
    perform public.log_event(v_issue, old.user_id, 'support_removed', 'A student removed their support', '{}'::jsonb);
  end if;
  return null;
end;
$$;
create trigger likes_after_change after insert or delete on public.issue_likes
  for each row execute function public.t_like_change();

create or replace function public.t_comment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_issue uuid := coalesce(new.issue_id, old.issue_id);
  v_title text;
begin
  update public.issues
  set comment_count = (select count(*) from public.issue_comments
                       where issue_id = v_issue and moderation_status = 'visible')
  where id = v_issue;

  select title into v_title from public.issues where id = v_issue;

  if tg_op = 'INSERT' then
    perform public.notify_followers(v_issue, new.user_id, 'New comment: ' || left(coalesce(v_title, ''), 80),
      left(new.comment, 140), 'comment');
  elsif tg_op = 'UPDATE' and new.moderation_status is distinct from old.moderation_status then
    perform public.log_event(v_issue, auth.uid(), 'moderation_action',
      'A comment was ' || new.moderation_status || ' by a moderator',
      jsonb_build_object('comment_id', new.id));
    if new.moderation_status <> 'visible' then
      perform public.notify_user(new.user_id, v_issue, 'Your comment was ' || new.moderation_status,
        'A moderator ' || new.moderation_status || ' your comment on "' || left(coalesce(v_title, ''), 80) || '".', 'moderation');
    end if;
  end if;
  return null;
end;
$$;
create trigger comments_after_change after insert or update or delete on public.issue_comments
  for each row execute function public.t_comment_change();

create or replace function public.t_evidence_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event(new.issue_id, new.submitted_by, 'evidence_submitted',
      'External evidence link submitted (' || new.platform || ')',
      jsonb_build_object('evidence_id', new.id, 'platform', new.platform));
  elsif new.verification_status is distinct from old.verification_status then
    perform public.log_event(new.issue_id, auth.uid(), 'evidence_verified',
      'Evidence marked ' || replace(new.verification_status, '_', ' '),
      jsonb_build_object('evidence_id', new.id, 'status', new.verification_status));
  end if;
  return null;
end;
$$;
create trigger evidence_after_change after insert or update on public.issue_evidence
  for each row execute function public.t_evidence_change();

create or replace function public.t_response_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  select title into v_title from public.issues where id = new.issue_id;
  perform public.log_event(new.issue_id, new.recorded_by, 'official_response_recorded',
    'Official response recorded from ' || new.authority_name,
    jsonb_build_object('response_id', new.id, 'authority', new.authority_name));
  perform public.notify_followers(new.issue_id, null, 'Official response: ' || left(coalesce(v_title, ''), 80),
    'Response recorded from ' || new.authority_name || '.', 'official_response');
  return null;
end;
$$;
create trigger responses_after_insert after insert on public.official_responses
  for each row execute function public.t_response_insert();

create or replace function public.t_resolution_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  select title into v_title from public.issues where id = new.issue_id;
  if tg_op = 'INSERT' then
    perform public.log_event(new.issue_id, new.proposed_by, 'resolution_proposed',
      'Resolution proposed; pending moderator verification',
      jsonb_build_object('resolution_id', new.id, 'authority', new.responsible_authority));
    perform public.notify_followers(new.issue_id, new.proposed_by, 'Resolution proposed: ' || left(coalesce(v_title, ''), 80),
      'A resolution was proposed and awaits moderator verification.', 'resolution');
  elsif new.verification_status is distinct from old.verification_status then
    if new.verification_status = 'verified' then
      perform public.log_event(new.issue_id, new.verified_by, 'resolution_verified',
        'Resolution verified by a moderator', jsonb_build_object('resolution_id', new.id));
    elsif new.verification_status = 'rejected' then
      perform public.log_event(new.issue_id, new.verified_by, 'resolution_rejected',
        'Resolution proposal rejected by a moderator', jsonb_build_object('resolution_id', new.id));
    end if;
    perform public.notify_followers(new.issue_id, null, 'Resolution ' || new.verification_status || ': ' || left(coalesce(v_title, ''), 70),
      'A moderator reviewed the resolution proposal.', 'resolution');
    perform public.notify_user(new.proposed_by, new.issue_id, 'Your resolution proposal was reviewed',
      'Outcome: ' || replace(new.verification_status, '_', ' ') || '.', 'moderation');
  end if;
  return null;
end;
$$;
create trigger resolutions_after_change after insert or update on public.issue_resolutions
  for each row execute function public.t_resolution_change();

create or replace function public.t_reopen_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_event(new.issue_id, new.requested_by, 'reopen_requested',
    'Reopen requested', jsonb_build_object('request_id', new.id));
  return null;
end;
$$;
create trigger reopen_after_insert after insert on public.reopen_requests
  for each row execute function public.t_reopen_insert();

create or replace function public.t_campaign_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_event(new.issue_id, new.created_by, 'campaign_started',
    'Campaign started: ' || left(new.title, 100), jsonb_build_object('campaign_id', new.id));
  return null;
end;
$$;
create trigger campaigns_after_insert after insert on public.campaigns
  for each row execute function public.t_campaign_insert();

create or replace function public.t_campaign_supporter_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign uuid := coalesce(new.campaign_id, old.campaign_id);
begin
  update public.campaigns
  set supporter_count = (select count(*) from public.campaign_supporters where campaign_id = v_campaign)
  where id = v_campaign;
  return null;
end;
$$;
create trigger campaign_supporters_after_change after insert or delete on public.campaign_supporters
  for each row execute function public.t_campaign_supporter_change();

create or replace function public.t_campaign_update_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_issue uuid;
  v_title text;
begin
  select c.issue_id, c.title into v_issue, v_title from public.campaigns c where c.id = new.campaign_id;
  perform public.notify_followers(v_issue, new.author_id, 'Campaign update: ' || left(coalesce(v_title, ''), 80),
    left(new.body, 140), 'campaign_update');
  return null;
end;
$$;
create trigger campaign_updates_after_insert after insert on public.campaign_updates
  for each row execute function public.t_campaign_update_insert();

create or replace function public.t_suggestion_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    perform public.notify_user(new.user_id, null, 'Suggestion update: ' || left(new.title, 80),
      'Status is now ' || replace(new.status, '_', ' ') || '.', 'suggestion');
  end if;
  return null;
end;
$$;
create trigger suggestions_after_update after update on public.suggestions
  for each row execute function public.t_suggestion_status();

------------------------------------------------------------------------------
-- Moderator RPCs: the only way to verify resolutions / approve reopening
------------------------------------------------------------------------------
create or replace function public.review_resolution(p_resolution uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.issue_resolutions%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into r from public.issue_resolutions where id = p_resolution for update;
  if not found then
    raise exception 'Resolution not found';
  end if;
  if r.verification_status <> 'pending_verification' then
    raise exception 'This resolution was already reviewed';
  end if;

  update public.issue_resolutions
  set verification_status = case when p_approve then 'verified' else 'rejected' end,
      verified_by = auth.uid(), verified_at = now(), review_note = left(p_note, 500)
  where id = p_resolution;

  if p_approve then
    update public.issues set status = 'resolved' where id = r.issue_id and status <> 'resolved';
  end if;

  insert into public.moderation_logs (moderator_id, target_type, target_id, action, reason)
  values (auth.uid(), 'resolution', p_resolution,
          case when p_approve then 'approve_resolution' else 'reject_resolution' end, left(p_note, 500));
end;
$$;

create or replace function public.review_reopen(p_request uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.reopen_requests%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into q from public.reopen_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if q.status <> 'pending' then
    raise exception 'This request was already reviewed';
  end if;

  update public.reopen_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      reviewed_by = auth.uid(), reviewed_at = now(), review_note = left(p_note, 500)
  where id = p_request;

  if p_approve then
    update public.issues set status = 'reopened' where id = q.issue_id and status = 'resolved';
  end if;

  insert into public.moderation_logs (moderator_id, target_type, target_id, action, reason)
  values (auth.uid(), 'reopen_request', p_request,
          case when p_approve then 'approve_reopen' else 'reject_reopen' end, left(p_note, 500));
end;
$$;

revoke all on function public.review_resolution(uuid, boolean, text) from public, anon;
revoke all on function public.review_reopen(uuid, boolean, text) from public, anon;
grant execute on function public.review_resolution(uuid, boolean, text) to authenticated;
grant execute on function public.review_reopen(uuid, boolean, text) to authenticated;

------------------------------------------------------------------------------
-- Views
------------------------------------------------------------------------------
-- Feed view: security_invoker => issues RLS applies to the caller.
create view public.issue_feed with (security_invoker = true) as
select
  i.*,
  c.college_name,
  cat.label as category_label,
  p.full_name as creator_name,
  (i.support_count * 3 + i.comment_count * 2 + 1)::float8
    / power(extract(epoch from (now() - i.published_at)) / 3600.0 + 2, 1.3) as trending_score,
  exists (select 1 from public.issue_likes l where l.issue_id = i.id and l.user_id = (select auth.uid())) as supported_by_me,
  exists (select 1 from public.issue_follows f where f.issue_id = i.id and f.user_id = (select auth.uid())) as followed_by_me
from public.issues i
left join public.colleges c on c.id = i.college_id
left join public.categories cat on cat.slug = i.category
left join public.profiles p on p.id = i.created_by;

create view public.issue_timeline with (security_invoker = true) as
select h.*, p.full_name as actor_name, i.title as issue_title
from public.issue_history h
left join public.profiles p on p.id = h.actor_id
left join public.issues i on i.id = h.issue_id;

-- Aggregate-only views run as owner on purpose (they expose counts, never rows).
create view public.platform_stats as
select
  (select count(*) from public.issues where moderation_status = 'visible') as total_issues,
  (select count(*) from public.campaigns where status = 'active') as active_campaigns,
  (select count(*) from public.issues where moderation_status = 'visible'
     and status in ('open', 'under_review', 'campaign_active', 'submitted_to_authority', 'reopened')) as awaiting_action,
  (select count(*) from public.issues where moderation_status = 'visible' and status = 'resolved') as resolved_issues,
  (select coalesce(sum(support_count), 0) from public.issues where moderation_status = 'visible') as total_support;

create view public.issue_status_counts as
select status, count(*)::int as total
from public.issues where moderation_status = 'visible'
group by status;

------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------
alter table public.categories          enable row level security;
alter table public.colleges            enable row level security;
alter table public.issues              enable row level security;
alter table public.issue_likes         enable row level security;
alter table public.issue_follows       enable row level security;
alter table public.issue_comments      enable row level security;
alter table public.issue_evidence      enable row level security;
alter table public.issue_history       enable row level security;
alter table public.authority_directory enable row level security;
alter table public.issue_recipients    enable row level security;
alter table public.email_connections   enable row level security;
alter table public.email_campaigns     enable row level security;
alter table public.email_logs          enable row level security;
alter table public.official_responses  enable row level security;
alter table public.issue_resolutions   enable row level security;
alter table public.resolution_evidence enable row level security;
alter table public.reopen_requests     enable row level security;
alter table public.campaigns           enable row level security;
alter table public.campaign_supporters enable row level security;
alter table public.campaign_updates    enable row level security;
alter table public.contributors        enable row level security;
alter table public.suggestions         enable row level security;
alter table public.reports             enable row level security;
alter table public.notifications       enable row level security;
alter table public.moderation_logs     enable row level security;

-- categories / colleges: public reference data, admin-managed
create policy "categories readable" on public.categories for select to anon, authenticated using (true);
create policy "admins manage categories" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "colleges readable" on public.colleges for select to anon, authenticated using (true);
create policy "admins manage colleges" on public.colleges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- issues
create policy "issues readable" on public.issues for select to authenticated
  using (moderation_status = 'visible' or created_by = (select auth.uid()) or public.is_staff());
create policy "students create own issues" on public.issues for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "creator or staff edit issues" on public.issues for update to authenticated
  using (created_by = (select auth.uid()) or public.is_staff())
  with check (created_by = (select auth.uid()) or public.is_staff());

-- support and follows: private to the user (counts live on issues)
create policy "own support readable" on public.issue_likes for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "add own support" on public.issue_likes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_see_issue(issue_id));
create policy "remove own support" on public.issue_likes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "own follows readable" on public.issue_follows for select to authenticated
  using (user_id = (select auth.uid()));
create policy "add own follow" on public.issue_follows for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_see_issue(issue_id));
create policy "remove own follow" on public.issue_follows for delete to authenticated
  using (user_id = (select auth.uid()));

-- comments
create policy "comments readable" on public.issue_comments for select to authenticated
  using ((moderation_status = 'visible' and public.can_see_issue(issue_id))
         or user_id = (select auth.uid()) or public.is_staff());
create policy "add own comment" on public.issue_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_see_issue(issue_id));
create policy "edit own or moderate comment" on public.issue_comments for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff())
  with check (user_id = (select auth.uid()) or public.is_staff());
create policy "delete own comment" on public.issue_comments for delete to authenticated
  using (user_id = (select auth.uid()));

-- evidence
create policy "evidence readable" on public.issue_evidence for select to authenticated
  using (public.can_see_issue(issue_id));
create policy "submit evidence" on public.issue_evidence for insert to authenticated
  with check (submitted_by = (select auth.uid()) and verification_status = 'pending'
              and moderator_note is null and verified_at is null and verified_by is null
              and public.can_see_issue(issue_id));
create policy "moderators verify evidence" on public.issue_evidence for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- history: read-only for clients; rows are written only by triggers
create policy "history readable" on public.issue_history for select to authenticated
  using (public.can_see_issue(issue_id));

-- authority directory
create policy "active authorities readable" on public.authority_directory for select to authenticated
  using (is_active or public.is_admin());
create policy "admins manage authorities" on public.authority_directory for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "own recipients readable" on public.issue_recipients for select to authenticated
  using (selected_by = (select auth.uid()));
create policy "select own recipients" on public.issue_recipients for insert to authenticated
  with check (selected_by = (select auth.uid()) and public.can_see_issue(issue_id));
create policy "remove own recipients" on public.issue_recipients for delete to authenticated
  using (selected_by = (select auth.uid()));

-- email: own rows only; tokens and send logs are written server-side with the service role
create policy "own email connection readable" on public.email_connections for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own email campaigns readable" on public.email_campaigns for select to authenticated
  using (created_by = (select auth.uid()));
create policy "create own email draft" on public.email_campaigns for insert to authenticated
  with check (created_by = (select auth.uid()) and status = 'draft' and public.can_see_issue(issue_id));
create policy "edit own email draft" on public.email_campaigns for update to authenticated
  using (created_by = (select auth.uid()) and status = 'draft')
  with check (created_by = (select auth.uid()) and status = 'draft');
create policy "own email logs readable" on public.email_logs for select to authenticated
  using (sender_id = (select auth.uid()));

-- official responses: moderators record, students read
create policy "responses readable" on public.official_responses for select to authenticated
  using (public.can_see_issue(issue_id));
create policy "moderators record responses" on public.official_responses for insert to authenticated
  with check (public.is_staff() and recorded_by = (select auth.uid()));
create policy "moderators edit responses" on public.official_responses for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- resolutions: students propose; verification only through review_resolution()
create policy "resolutions readable" on public.issue_resolutions for select to authenticated
  using (public.can_see_issue(issue_id));
create policy "propose resolution" on public.issue_resolutions for insert to authenticated
  with check (proposed_by = (select auth.uid()) and verification_status = 'pending_verification'
              and verified_by is null and verified_at is null and review_note is null
              and public.can_see_issue(issue_id));

create policy "resolution evidence readable" on public.resolution_evidence for select to authenticated
  using (exists (select 1 from public.issue_resolutions r where r.id = resolution_id));
create policy "proposer adds resolution evidence" on public.resolution_evidence for insert to authenticated
  with check (verification_status = 'pending' and exists (
    select 1 from public.issue_resolutions r
    where r.id = resolution_id and r.proposed_by = (select auth.uid())
      and r.verification_status = 'pending_verification'));
create policy "moderators verify resolution evidence" on public.resolution_evidence for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- reopen requests: students request, moderators review through review_reopen()
create policy "own or staff reopen requests readable" on public.reopen_requests for select to authenticated
  using (requested_by = (select auth.uid()) or public.is_staff());
create policy "request reopen" on public.reopen_requests for insert to authenticated
  with check (requested_by = (select auth.uid()) and status = 'pending'
              and reviewed_by is null and reviewed_at is null and review_note is null
              and exists (select 1 from public.issues i where i.id = issue_id and i.status = 'resolved'));

-- campaigns
create policy "campaigns readable" on public.campaigns for select to authenticated
  using (public.can_see_issue(issue_id));
create policy "start own campaign" on public.campaigns for insert to authenticated
  with check (created_by = (select auth.uid()) and public.can_see_issue(issue_id));
create policy "creator or staff edit campaign" on public.campaigns for update to authenticated
  using (created_by = (select auth.uid()) or public.is_staff())
  with check (created_by = (select auth.uid()) or public.is_staff());

create policy "own campaign support readable" on public.campaign_supporters for select to authenticated
  using (user_id = (select auth.uid()));
create policy "support campaign" on public.campaign_supporters for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.campaigns c where c.id = campaign_id));
create policy "withdraw campaign support" on public.campaign_supporters for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "campaign updates readable" on public.campaign_updates for select to authenticated
  using (exists (select 1 from public.campaigns c where c.id = campaign_id));
create policy "creator posts campaign update" on public.campaign_updates for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (
    select 1 from public.campaigns c where c.id = campaign_id and c.created_by = (select auth.uid())));

-- contributors: only approved are public; admins control the list
create policy "approved contributors public" on public.contributors for select to anon, authenticated
  using (approval_status = 'approved');
create policy "admins manage contributors" on public.contributors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- suggestions
create policy "own suggestions readable" on public.suggestions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "submit suggestion" on public.suggestions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and admin_note is null);
create policy "admins review suggestions" on public.suggestions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- reports (bugs and abuse reports); guests may file bug reports without an account
create policy "guest bug reports" on public.reports for insert to anon
  with check (user_id is null and report_type = 'bug' and status = 'open');
create policy "student reports" on public.reports for insert to authenticated
  with check ((user_id is null or user_id = (select auth.uid())) and status = 'open');
create policy "own or staff reports readable" on public.reports for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "staff update reports" on public.reports for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- notifications: private; created only by triggers
create policy "own notifications readable" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own notifications update" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own notifications delete" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- moderation log: staff read and append only
create policy "staff read moderation log" on public.moderation_logs for select to authenticated
  using (public.is_staff());
create policy "staff write moderation log" on public.moderation_logs for insert to authenticated
  with check (public.is_staff() and moderator_id = (select auth.uid()));

------------------------------------------------------------------------------
-- Privileges (RLS decides row access; grants decide the outer envelope)
------------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant select on public.categories, public.colleges, public.contributors to anon;
grant insert on public.reports to anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.issue_feed, public.issue_timeline, public.platform_stats, public.issue_status_counts to authenticated;

-- history and moderation log are append-only: clients can never write them
revoke insert, update, delete on public.issue_history from authenticated;
revoke update, delete on public.moderation_logs from authenticated;

-- notifications: clients may only toggle is_read
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

-- resolutions / reopen requests change only through the review RPCs
revoke update, delete on public.issue_resolutions from authenticated;
revoke update, delete on public.reopen_requests from authenticated;
revoke delete on public.issues from authenticated;

-- email secrets never reach API clients; send logs are written server-side
revoke all on public.email_connections from authenticated;
grant select (id, user_id, provider, provider_email, connection_status, connected_at, updated_at)
  on public.email_connections to authenticated;
revoke insert, update, delete on public.email_logs from authenticated;

-- 0003: Bihar / BEU college list + "add my own college / category" for signed-in students.
-- Safe to run more than once.

alter table public.colleges   add column if not exists created_by uuid references public.profiles (id) on delete set null;
alter table public.categories add column if not exists created_by uuid references public.profiles (id) on delete set null;

-- Case-insensitive uniqueness so manual additions cannot duplicate existing names.
create unique index if not exists colleges_name_ci_key on public.colleges (lower(college_name));
create unique index if not exists categories_label_ci_key on public.categories (lower(label));

-- Government engineering colleges of Bihar under Bihar Engineering University (best-effort list;
-- is_verified stays false until an admin confirms each entry).
insert into public.colleges (college_name, university_name, location, state, is_verified)
select v.n, 'Bihar Engineering University', v.l, 'Bihar', false
from (values
  ('Muzaffarpur Institute of Technology, Muzaffarpur', 'Muzaffarpur'),
  ('Bhagalpur College of Engineering, Bhagalpur', 'Bhagalpur'),
  ('Darbhanga College of Engineering, Darbhanga', 'Darbhanga'),
  ('Motihari College of Engineering, Motihari', 'Motihari'),
  ('Gaya College of Engineering, Gaya', 'Gaya'),
  ('Nalanda College of Engineering, Chandi', 'Chandi, Nalanda'),
  ('Sitamarhi Institute of Technology, Sitamarhi', 'Sitamarhi'),
  ('Saharsa College of Engineering, Saharsa', 'Saharsa'),
  ('Katihar Engineering College, Katihar', 'Katihar'),
  ('Purnea College of Engineering, Purnea', 'Purnea'),
  ('Loknayak Jai Prakash Institute of Technology, Chapra', 'Chapra'),
  ('Bakhtiyarpur College of Engineering, Patna', 'Bakhtiyarpur, Patna'),
  ('Shershah Engineering College, Sasaram', 'Sasaram'),
  ('Rashtrakavi Ramdhari Singh Dinkar College of Engineering, Begusarai', 'Begusarai'),
  ('Government Engineering College, Vaishali', 'Vaishali'),
  ('Government Engineering College, Siwan', 'Siwan'),
  ('Government Engineering College, Banka', 'Banka'),
  ('Government Engineering College, Munger', 'Munger'),
  ('Government Engineering College, Kishanganj', 'Kishanganj'),
  ('Government Engineering College, Aurangabad', 'Aurangabad'),
  ('Government Engineering College, Bhojpur', 'Bhojpur'),
  ('Government Engineering College, Buxar', 'Buxar'),
  ('Government Engineering College, Kaimur', 'Kaimur'),
  ('Government Engineering College, Madhepura', 'Madhepura'),
  ('Government Engineering College, Nawada', 'Nawada'),
  ('Government Engineering College, Sheikhpura', 'Sheikhpura'),
  ('Government Engineering College, Arwal', 'Arwal'),
  ('Government Engineering College, Gopalganj', 'Gopalganj'),
  ('Government Engineering College, Jamui', 'Jamui'),
  ('Government Engineering College, Khagaria', 'Khagaria'),
  ('Government Engineering College, Lakhisarai', 'Lakhisarai'),
  ('Government Engineering College, Samastipur', 'Samastipur'),
  ('Government Engineering College, Supaul', 'Supaul'),
  ('Government Engineering College, Araria', 'Araria'),
  ('Government Engineering College, Sheohar', 'Sheohar'),
  ('Netaji Subhas Institute of Technology, Patna', 'Patna')
) as v(n, l)
on conflict do nothing;

-- Central / national institutes in Bihar.
insert into public.colleges (college_name, university_name, location, state, is_verified) values
  ('Indian Institute of Technology Patna', 'Indian Institute of Technology Patna', 'Bihta, Patna', 'Bihar', false),
  ('National Institute of Technology Patna', 'National Institute of Technology Patna', 'Patna', 'Bihar', false),
  ('Indian Institute of Information Technology Bhagalpur', 'Indian Institute of Information Technology Bhagalpur', 'Bhagalpur', 'Bihar', false)
on conflict do nothing;

-- Students can add a missing college. Created unverified, 3 per user per day.
create or replace function public.add_college(p_name text, p_university text default 'Bihar Engineering University')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_uni  text := left(regexp_replace(trim(coalesce(p_university, '')), '\s+', ' ', 'g'), 160);
  v_id   uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 160 then
    raise exception 'College name must be 3 to 160 characters';
  end if;
  if char_length(v_uni) < 2 then v_uni := 'Bihar Engineering University'; end if;

  select id into v_id from public.colleges where lower(college_name) = lower(v_name) limit 1;
  if v_id is not null then return v_id; end if;

  if (select count(*) from public.colleges
        where created_by = (select auth.uid()) and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Rate limit reached. Please wait a while before trying again.' using errcode = 'P0001';
  end if;

  insert into public.colleges (college_name, university_name, state, is_verified, created_by)
  values (v_name, v_uni, 'Bihar', false, (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;

-- Students can add a missing category. 3 per user per day.
create or replace function public.add_category(p_label text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text := regexp_replace(trim(coalesce(p_label, '')), '\s+', ' ', 'g');
  v_slug  text;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if char_length(v_label) < 2 or char_length(v_label) > 60 then
    raise exception 'Category must be 2 to 60 characters';
  end if;

  select slug into v_slug from public.categories where lower(label) = lower(v_label) limit 1;
  if v_slug is not null then return v_slug; end if;

  v_slug := left(trim(both '-' from lower(regexp_replace(v_label, '[^a-zA-Z0-9]+', '-', 'g'))), 40);
  if v_slug !~ '^[a-z0-9-]{2,40}$' then
    raise exception 'Use letters or numbers in the category name';
  end if;

  if (select count(*) from public.categories
        where created_by = (select auth.uid()) and created_at > now() - interval '1 day') >= 3 then
    raise exception 'Rate limit reached. Please wait a while before trying again.' using errcode = 'P0001';
  end if;

  insert into public.categories (slug, label, sort_order, created_by)
  values (v_slug, v_label, 100, (select auth.uid()))
  on conflict (slug) do nothing;
  return v_slug;
end;
$$;

revoke execute on function public.add_college(text, text) from public, anon;
revoke execute on function public.add_category(text) from public, anon;
grant execute on function public.add_college(text, text) to authenticated;
grant execute on function public.add_category(text) to authenticated;

-- Development seed. Safe to run more than once. Contains reference data only:
-- no fake issues, comments, authorities, contributors or statistics.
-- Authority contacts must be added by an administrator with a real source URL.

insert into public.colleges (college_name, university_name, location, district, state, is_verified)
values ('Government Engineering College, Jehanabad', 'Bihar Engineering University', 'Jehanabad', 'Jehanabad', 'Bihar', false)
on conflict (college_name, university_name) do nothing;
