-- Development seed. Safe to run more than once. Contains reference data only:
-- no fake issues, comments, authorities, contributors or statistics.
-- Authority contacts must be added by an administrator with a real source URL.

insert into public.colleges (college_name, university_name, location, district, state, is_verified)
values ('Government Engineering College, Jehanabad', 'Bihar Engineering University', 'Jehanabad', 'Jehanabad', 'Bihar', false)
on conflict (college_name, university_name) do nothing;
