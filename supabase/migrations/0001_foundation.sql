-- Connect+ Phase 1: profiles, admin roles, RLS
-- Run in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

-- Shared updated_at trigger ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles --------------------------------------------------------------------
-- Email is intentionally NOT stored here: it lives only in auth.users and is
-- never exposed through this table.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null check (char_length(full_name) between 2 and 80),
  college       text check (college is null or char_length(college) <= 120),
  university    text check (university is null or char_length(university) <= 120),
  branch        text check (branch is null or char_length(branch) <= 80),
  academic_year smallint check (academic_year is null or academic_year between 1 and 6),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile when a user signs up -----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- admin_roles -------------------------------------------------------------------
create type public.admin_role as enum ('moderator', 'admin');

create table public.admin_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.admin_role not null,
  granted_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- Helper used by RLS policies. SECURITY DEFINER so it can read admin_roles
-- without exposing that table to clients.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_roles where user_id = (select auth.uid()));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Row Level Security ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;

-- Signed-in students can see public profile fields (name, college, branch...).
create policy "profiles are readable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may only update their own profile.
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Inserts happen only through the handle_new_user trigger; deletes cascade from auth.users.
-- (No insert/delete policies => clients cannot do either.)

-- Users can see only their own role row; only admins can manage roles.
create policy "users read own admin role"
  on public.admin_roles for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "admins manage roles"
  on public.admin_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- To bootstrap the first admin, run once in the SQL editor as the project owner:
--   insert into public.admin_roles (user_id, role) values ('<your-auth-user-uuid>', 'admin');
