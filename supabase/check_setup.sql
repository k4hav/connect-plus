-- Run in Supabase SQL Editor. Shows what is (not) set up. Every row should say OK.
select 'categories table' as item, case when to_regclass('public.categories') is not null then 'OK' else 'MISSING -> run 0002_core.sql' end as status
union all select 'colleges table', case when to_regclass('public.colleges') is not null then 'OK' else 'MISSING -> run 0002_core.sql' end
union all select 'issues table', case when to_regclass('public.issues') is not null then 'OK' else 'MISSING -> run 0002_core.sql' end
union all select 'add_college function', case when to_regprocedure('public.add_college(text,text)') is not null then 'OK' else 'MISSING -> run 0003' end
union all select 'add_category function', case when to_regprocedure('public.add_category(text)') is not null then 'OK' else 'MISSING -> run 0003' end;

-- Only works once the tables exist:
-- select (select count(*) from public.categories) as categories, (select count(*) from public.colleges) as colleges;
