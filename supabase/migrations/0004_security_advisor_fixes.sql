-- 0004: fixes for Supabase Security/Performance Advisor warnings. Safe to run more than once.

-- 1) "Security Definer View": make the two aggregate views run with the caller's rights.
--    They only count rows that every signed-in student can already read, so results are unchanged.
alter view public.platform_stats set (security_invoker = true);
alter view public.issue_status_counts set (security_invoker = true);

-- 2) "Function Search Path Mutable"
alter function public.set_updated_at() set search_path = '';

-- 3) "Public can execute SECURITY DEFINER function": trigger functions must never be callable from the API.
--    (Triggers keep working: EXECUTE is only checked when a trigger is created, not when it fires.)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.fn);
  end loop;
end $$;

-- 4) "Multiple Permissive Policies": split the admin "for all" policies so SELECT has one policy only.
drop policy if exists "admins manage roles" on public.admin_roles;
drop policy if exists "admins insert roles" on public.admin_roles;
create policy "admins insert roles" on public.admin_roles for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update roles" on public.admin_roles;
create policy "admins update roles" on public.admin_roles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete roles" on public.admin_roles;
create policy "admins delete roles" on public.admin_roles for delete to authenticated using (public.is_admin());

drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "admins insert categories" on public.categories;
create policy "admins insert categories" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update categories" on public.categories;
create policy "admins update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete categories" on public.categories;
create policy "admins delete categories" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "admins manage colleges" on public.colleges;
drop policy if exists "admins insert colleges" on public.colleges;
create policy "admins insert colleges" on public.colleges for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update colleges" on public.colleges;
create policy "admins update colleges" on public.colleges for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete colleges" on public.colleges;
create policy "admins delete colleges" on public.colleges for delete to authenticated using (public.is_admin());

drop policy if exists "admins manage authorities" on public.authority_directory;
drop policy if exists "admins insert authorities" on public.authority_directory;
create policy "admins insert authorities" on public.authority_directory for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update authorities" on public.authority_directory;
create policy "admins update authorities" on public.authority_directory for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete authorities" on public.authority_directory;
create policy "admins delete authorities" on public.authority_directory for delete to authenticated using (public.is_admin());

drop policy if exists "admins manage contributors" on public.contributors;
drop policy if exists "approved contributors public" on public.contributors;
drop policy if exists "approved contributors public" on public.contributors;
create policy "approved contributors public" on public.contributors for select to anon using (approval_status = 'approved');
drop policy if exists "contributors readable by students" on public.contributors;
create policy "contributors readable by students" on public.contributors for select to authenticated
  using (approval_status = 'approved' or public.is_admin());
drop policy if exists "admins insert contributors" on public.contributors;
create policy "admins insert contributors" on public.contributors for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update contributors" on public.contributors;
create policy "admins update contributors" on public.contributors for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete contributors" on public.contributors;
create policy "admins delete contributors" on public.contributors for delete to authenticated using (public.is_admin());
