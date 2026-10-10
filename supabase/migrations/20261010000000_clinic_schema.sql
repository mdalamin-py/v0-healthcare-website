-- Clinic schema: doctors, weekly schedules, on-call shifts and appointments.
-- Patient data is never readable by the public; bookings and lookups go
-- through security-definer functions that expose only what is required.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.clinic_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/Los_Angeles')::date
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  full_name text not null check (char_length(full_name) between 2 and 100),
  specialty text not null check (char_length(specialty) between 2 and 100),
  qualification text check (char_length(qualification) <= 200),
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  bio text check (char_length(bio) <= 2000),
  photo_url text check (photo_url ~ '^https://'),
  consultation_fee numeric(10, 2) check (consultation_fee >= 0),
  languages text[] not null default array['English'],
  room text check (char_length(room) <= 50),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index doctors_specialty_idx on public.doctors (specialty) where is_active;

create trigger doctors_set_updated_at
before update on public.doctors
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Weekly schedules (0 = Sunday … 6 = Saturday)
-- ---------------------------------------------------------------------------

create table public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  max_patients integer not null default 20 check (max_patients between 1 and 200),
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (doctor_id, weekday, start_time)
);

create index doctor_schedules_weekday_idx on public.doctor_schedules (weekday);

-- ---------------------------------------------------------------------------
-- On-call shifts
-- ---------------------------------------------------------------------------

create table public.on_call_shifts (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index on_call_shifts_range_idx on public.on_call_shifts (starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Appointments
-- ---------------------------------------------------------------------------

create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  doctor_id uuid not null references public.doctors (id) on delete restrict,
  schedule_id uuid not null references public.doctor_schedules (id) on delete restrict,
  appointment_date date not null,
  serial_no integer not null check (serial_no > 0),
  patient_name text not null check (char_length(patient_name) between 2 and 100),
  patient_phone text not null check (char_length(patient_phone) between 7 and 25),
  patient_email text check (char_length(patient_email) <= 254),
  patient_age integer check (patient_age between 0 and 130),
  patient_gender text check (patient_gender in ('female', 'male', 'other')),
  reason text check (char_length(reason) <= 1000),
  status public.appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, appointment_date, serial_no)
);

create index appointments_date_idx on public.appointments (appointment_date, doctor_id);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_schedules enable row level security;
alter table public.on_call_shifts enable row level security;
alter table public.appointments enable row level security;

create policy "Admins can see their own membership"
on public.admins for select
to authenticated
using (user_id = auth.uid());

create policy "Active doctors are public"
on public.doctors for select
to anon, authenticated
using (is_active or public.is_admin());

create policy "Admins manage doctors"
on public.doctors for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Schedules of active doctors are public"
on public.doctor_schedules for select
to anon, authenticated
using (
  exists (select 1 from public.doctors d where d.id = doctor_id and (d.is_active or public.is_admin()))
);

create policy "Admins manage schedules"
on public.doctor_schedules for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "On-call shifts are public"
on public.on_call_shifts for select
to anon, authenticated
using (
  exists (select 1 from public.doctors d where d.id = doctor_id and (d.is_active or public.is_admin()))
);

create policy "Admins manage on-call shifts"
on public.on_call_shifts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage appointments"
on public.appointments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public functions
-- ---------------------------------------------------------------------------

-- Remaining capacity per session for the next p_days days. Exposes counts only.
create or replace function public.get_availability(p_doctor_id uuid, p_days integer default 30)
returns table (
  schedule_id uuid,
  appointment_date date,
  start_time time,
  end_time time,
  max_patients integer,
  booked integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    d::date,
    s.start_time,
    s.end_time,
    s.max_patients,
    (
      select count(*)::integer
      from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = d::date and a.status <> 'cancelled'
    )
  from public.doctor_schedules s
  join public.doctors doc on doc.id = s.doctor_id and doc.is_active
  cross join generate_series(
    public.clinic_today(),
    public.clinic_today() + least(greatest(p_days, 1), 60) - 1,
    interval '1 day'
  ) as d
  where s.doctor_id = p_doctor_id
    and extract(dow from d) = s.weekday
    and (
      d::date > public.clinic_today()
      or s.end_time > (now() at time zone 'America/Los_Angeles')::time
    )
  order by d, s.start_time
$$;

create or replace function public.book_appointment(
  p_schedule_id uuid,
  p_date date,
  p_name text,
  p_phone text,
  p_email text default null,
  p_age integer default null,
  p_gender text default null,
  p_reason text default null
)
returns table (
  reference text,
  serial_no integer,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_schedule public.doctor_schedules%rowtype;
  v_doctor public.doctors%rowtype;
  v_booked integer;
  v_serial integer;
  v_reference text;
  v_phone_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  select * into v_schedule from public.doctor_schedules s where s.id = p_schedule_id;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_doctor from public.doctors d where d.id = v_schedule.doctor_id and d.is_active;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_date is null
    or p_date < public.clinic_today()
    or p_date > public.clinic_today() + 60
    or extract(dow from p_date) <> v_schedule.weekday
    or (p_date = public.clinic_today() and v_schedule.end_time <= (now() at time zone 'America/Los_Angeles')::time)
  then
    raise exception 'INVALID_DATE' using errcode = 'P0001';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(trim(p_name)) > 100
    or char_length(v_phone_digits) not between 10 and 15
  then
    raise exception 'INVALID_PATIENT' using errcode = 'P0001';
  end if;

  -- Serialize bookings for the same session and day.
  perform pg_advisory_xact_lock(hashtext(p_schedule_id::text || ':' || p_date::text));

  if exists (
    select 1 from public.appointments a
    where a.schedule_id = p_schedule_id
      and a.appointment_date = p_date
      and a.status <> 'cancelled'
      and regexp_replace(a.patient_phone, '\D', '', 'g') = v_phone_digits
  ) then
    raise exception 'DUPLICATE_BOOKING' using errcode = 'P0001';
  end if;

  select count(*) into v_booked
  from public.appointments a
  where a.schedule_id = p_schedule_id and a.appointment_date = p_date and a.status <> 'cancelled';

  if v_booked >= v_schedule.max_patients then
    raise exception 'SESSION_FULL' using errcode = 'P0001';
  end if;

  select coalesce(max(a.serial_no), 0) + 1 into v_serial
  from public.appointments a
  where a.schedule_id = p_schedule_id and a.appointment_date = p_date;

  v_reference := 'DHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.appointments (
    reference, doctor_id, schedule_id, appointment_date, serial_no,
    patient_name, patient_phone, patient_email, patient_age, patient_gender, reason
  ) values (
    v_reference, v_doctor.id, v_schedule.id, p_date, v_serial,
    trim(p_name), trim(p_phone), nullif(trim(p_email), ''), p_age, nullif(p_gender, ''), nullif(trim(p_reason), '')
  );

  return query select v_reference, v_serial, p_date, v_schedule.start_time, v_schedule.end_time,
    v_doctor.full_name, v_doctor.specialty;
end;
$$;

-- Look up a booking by reference + phone; returns no patient details.
create or replace function public.lookup_appointment(p_reference text, p_phone text)
returns table (
  reference text,
  status public.appointment_status,
  serial_no integer,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.reference, a.status, a.serial_no, a.appointment_date, s.start_time, s.end_time, d.full_name, d.specialty
  from public.appointments a
  join public.doctor_schedules s on s.id = a.schedule_id
  join public.doctors d on d.id = a.doctor_id
  where a.reference = upper(trim(p_reference))
    and regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
$$;

create or replace function public.cancel_appointment(p_reference text, p_phone text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.appointments a
  set status = 'cancelled'
  where a.reference = upper(trim(p_reference))
    and regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and a.status in ('pending', 'confirmed')
    and a.appointment_date >= public.clinic_today();
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.get_availability(uuid, integer) from public;
revoke all on function public.book_appointment(uuid, date, text, text, text, integer, text, text) from public;
revoke all on function public.lookup_appointment(text, text) from public;
revoke all on function public.cancel_appointment(text, text) from public;

grant execute on function public.get_availability(uuid, integer) to anon, authenticated;
grant execute on function public.book_appointment(uuid, date, text, text, text, integer, text, text) to anon, authenticated;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;
grant execute on function public.cancel_appointment(text, text) to anon, authenticated;
