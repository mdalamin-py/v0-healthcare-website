-- Doctor self-registration. A signed-in user applies; an admin approves, which
-- creates the doctor profile and links it to the applicant's email for the portal.

create table public.doctor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  full_name text not null check (char_length(full_name) between 2 and 96),
  phone text not null check (char_length(phone) between 7 and 25),
  specialty text not null check (char_length(specialty) between 2 and 100),
  qualification text not null check (char_length(qualification) between 2 and 200),
  license_number text not null check (char_length(license_number) between 3 and 50),
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  languages text[] not null default '{English}',
  bio text check (char_length(bio) <= 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text check (char_length(review_note) <= 300),
  doctor_id uuid references public.doctors (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- One open application per account.
create unique index doctor_applications_one_pending on public.doctor_applications (user_id) where status = 'pending';

alter table public.doctor_applications enable row level security;

create policy "Applicants read their own applications"
on public.doctor_applications for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "Admins manage applications"
on public.doctor_applications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.submit_doctor_application(
  p_full_name text,
  p_phone text,
  p_specialty text,
  p_qualification text,
  p_license_number text,
  p_experience_years integer,
  p_languages text[],
  p_bio text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_email text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email = '' then
    raise exception 'EMAIL_REQUIRED' using errcode = 'P0001';
  end if;
  if public.current_doctor_id() is not null then
    raise exception 'ALREADY_DOCTOR' using errcode = 'P0001';
  end if;
  if exists (select 1 from doctor_applications where user_id = auth.uid() and status = 'pending') then
    raise exception 'APPLICATION_PENDING' using errcode = 'P0001';
  end if;

  insert into doctor_applications (
    user_id, email, full_name, phone, specialty, qualification, license_number, experience_years, languages, bio
  ) values (
    auth.uid(), lower(v_email), trim(p_full_name), trim(p_phone), trim(p_specialty), trim(p_qualification),
    upper(trim(p_license_number)), coalesce(p_experience_years, 0),
    coalesce(nullif(p_languages, '{}'), '{English}'), nullif(trim(coalesce(p_bio, '')), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.review_doctor_application(p_application_id uuid, p_approve boolean, p_note text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_app doctor_applications%rowtype;
  v_slug text;
  v_doctor uuid;
  v_suffix integer := 1;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_app from doctor_applications where id = p_application_id for update;
  if not found or v_app.status <> 'pending' then
    raise exception 'APPLICATION_CLOSED' using errcode = 'P0001';
  end if;

  if not p_approve then
    update doctor_applications
    set status = 'rejected', review_note = nullif(left(trim(coalesce(p_note, '')), 300), ''), reviewed_at = now()
    where id = p_application_id;
    return null;
  end if;

  -- Unique, URL-safe slug from the doctor's name.
  v_slug := trim(both '-' from regexp_replace(lower(regexp_replace(v_app.full_name, '^dr\.?\s+', '', 'i')), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then
    v_slug := 'doctor';
  end if;
  while exists (select 1 from doctors where slug = case when v_suffix = 1 then v_slug else v_slug || '-' || v_suffix end) loop
    v_suffix := v_suffix + 1;
  end loop;
  if v_suffix > 1 then
    v_slug := v_slug || '-' || v_suffix;
  end if;

  insert into doctors (slug, full_name, specialty, qualification, experience_years, bio, languages, kind)
  values (
    v_slug,
    case when v_app.full_name ~* '^dr\.?\s' then v_app.full_name else 'Dr. ' || v_app.full_name end,
    v_app.specialty, v_app.qualification, v_app.experience_years, v_app.bio, v_app.languages, 'consultant'
  )
  returning id into v_doctor;

  insert into doctor_contacts (doctor_id, email) values (v_doctor, v_app.email)
  on conflict (doctor_id) do update set email = excluded.email;

  update doctor_applications
  set status = 'approved', doctor_id = v_doctor, review_note = nullif(left(trim(coalesce(p_note, '')), 300), ''), reviewed_at = now()
  where id = p_application_id;
  return v_doctor;
end;
$$;

revoke all on function public.submit_doctor_application(text, text, text, text, text, integer, text[], text) from public;
revoke all on function public.review_doctor_application(uuid, boolean, text) from public;
grant execute on function public.submit_doctor_application(text, text, text, text, text, integer, text[], text) to authenticated;
grant execute on function public.review_doctor_application(uuid, boolean, text) to authenticated;
