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
