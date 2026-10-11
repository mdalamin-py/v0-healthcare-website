-- >>> 20261010000000_clinic_schema.sql
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


-- >>> 20261011000000_visit_types.sql
-- Visit types: in-clinic, video consultation and home visit.

create type public.visit_type as enum ('in_clinic', 'video', 'home_visit');

alter table public.doctors
  add column visit_types public.visit_type[] not null default array['in_clinic', 'video']::public.visit_type[]
  check (cardinality(visit_types) > 0);

alter table public.appointments
  add column visit_type public.visit_type not null default 'in_clinic',
  add column patient_address text check (char_length(patient_address) <= 300);

drop function public.book_appointment(uuid, date, text, text, text, integer, text, text);
drop function public.lookup_appointment(text, text);

create function public.book_appointment(
  p_schedule_id uuid,
  p_date date,
  p_name text,
  p_phone text,
  p_email text default null,
  p_age integer default null,
  p_gender text default null,
  p_reason text default null,
  p_visit_type public.visit_type default 'in_clinic',
  p_address text default null
)
returns table (
  reference text,
  serial_no integer,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text,
  visit_type public.visit_type
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

  if p_visit_type is null or not (p_visit_type = any (v_doctor.visit_types)) then
    raise exception 'VISIT_TYPE_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if p_visit_type = 'home_visit' and char_length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'ADDRESS_REQUIRED' using errcode = 'P0001';
  end if;

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
    reference, doctor_id, schedule_id, appointment_date, serial_no, visit_type, patient_address,
    patient_name, patient_phone, patient_email, patient_age, patient_gender, reason
  ) values (
    v_reference, v_doctor.id, v_schedule.id, p_date, v_serial, p_visit_type,
    case when p_visit_type = 'home_visit' then trim(p_address) end,
    trim(p_name), trim(p_phone), nullif(trim(p_email), ''), p_age, nullif(p_gender, ''), nullif(trim(p_reason), '')
  );

  return query select v_reference, v_serial, p_date, v_schedule.start_time, v_schedule.end_time,
    v_doctor.full_name, v_doctor.specialty, p_visit_type;
end;
$$;

create function public.lookup_appointment(p_reference text, p_phone text)
returns table (
  reference text,
  status public.appointment_status,
  serial_no integer,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text,
  visit_type public.visit_type
)
language sql
stable
security definer
set search_path = public
as $$
  select a.reference, a.status, a.serial_no, a.appointment_date, s.start_time, s.end_time, d.full_name, d.specialty,
    a.visit_type
  from public.appointments a
  join public.doctor_schedules s on s.id = a.schedule_id
  join public.doctors d on d.id = a.doctor_id
  where a.reference = upper(trim(p_reference))
    and regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
$$;

revoke all on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) from public;
revoke all on function public.lookup_appointment(text, text) from public;
grant execute on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) to anon, authenticated;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;


-- >>> 20261012000000_patient_accounts.sql
-- Patient accounts: profiles linked to Supabase Auth users. Booking now
-- requires a signed-in patient, and patients can see their own appointments.

create table public.patients (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  email text check (char_length(email) <= 254),
  date_of_birth date check (date_of_birth <= current_date),
  gender text check (gender in ('female', 'male', 'other')),
  address text check (char_length(address) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

alter table public.patients enable row level security;

create policy "Patients manage their own profile"
on public.patients for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Admins read patient profiles"
on public.patients for select
to authenticated
using (public.is_admin());

alter table public.appointments
  add column patient_id uuid references auth.users (id) on delete set null;

create index appointments_patient_idx on public.appointments (patient_id, appointment_date desc);

create policy "Patients read their own appointments"
on public.appointments for select
to authenticated
using (patient_id = auth.uid());

-- Require a signed-in patient and link the booking to their account.
create or replace function public.link_appointment_to_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  new.patient_id := auth.uid();
  return new;
end;
$$;

create trigger appointments_link_patient
before insert on public.appointments
for each row execute function public.link_appointment_to_patient();

revoke execute on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) from anon;

create or replace function public.cancel_my_appointment(p_appointment_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update public.appointments a
  set status = 'cancelled'
  where a.id = p_appointment_id
    and a.patient_id = auth.uid()
    and a.status in ('pending', 'confirmed')
    and a.appointment_date >= public.clinic_today();
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.cancel_my_appointment(uuid) from public;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;


-- >>> 20261013000000_live_queue.sql
-- Live queue: tracks which serial is being served in each session today.

create table public.queue_state (
  schedule_id uuid not null references public.doctor_schedules (id) on delete cascade,
  queue_date date not null,
  now_serving integer not null default 0 check (now_serving >= 0),
  updated_at timestamptz not null default now(),
  primary key (schedule_id, queue_date)
);

alter table public.queue_state enable row level security;

create policy "Queue state is public"
on public.queue_state for select
to anon, authenticated
using (true);

create policy "Admins manage queue state"
on public.queue_state for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Today's sessions with live progress. Exposes counts only, never patient data.
create or replace function public.get_today_queue()
returns table (
  schedule_id uuid,
  doctor_id uuid,
  doctor_name text,
  doctor_slug text,
  specialty text,
  start_time time,
  end_time time,
  now_serving integer,
  total integer,
  waiting integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    d.id,
    d.full_name,
    d.slug,
    d.specialty,
    s.start_time,
    s.end_time,
    coalesce(q.now_serving, 0),
    (select count(*)::integer from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = public.clinic_today() and a.status <> 'cancelled'),
    (select count(*)::integer from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = public.clinic_today()
        and a.status in ('pending', 'confirmed') and a.serial_no > coalesce(q.now_serving, 0)),
    q.updated_at
  from public.doctor_schedules s
  join public.doctors d on d.id = s.doctor_id and d.is_active
  left join public.queue_state q on q.schedule_id = s.id and q.queue_date = public.clinic_today()
  where s.weekday = extract(dow from public.clinic_today())
  order by s.start_time, d.full_name
$$;

-- Advances a session to the next waiting patient and completes the previous one.
create or replace function public.call_next_patient(p_schedule_id uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_today date := public.clinic_today();
  v_current integer;
  v_next integer;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  insert into public.queue_state (schedule_id, queue_date)
  values (p_schedule_id, v_today)
  on conflict (schedule_id, queue_date) do nothing;

  select q.now_serving into v_current
  from public.queue_state q
  where q.schedule_id = p_schedule_id and q.queue_date = v_today
  for update;

  update public.appointments a
  set status = 'completed'
  where a.schedule_id = p_schedule_id and a.appointment_date = v_today
    and a.serial_no = v_current and a.status in ('pending', 'confirmed');

  select min(a.serial_no) into v_next
  from public.appointments a
  where a.schedule_id = p_schedule_id and a.appointment_date = v_today
    and a.serial_no > v_current and a.status in ('pending', 'confirmed');

  update public.queue_state q
  set now_serving = coalesce(v_next, v_current), updated_at = now()
  where q.schedule_id = p_schedule_id and q.queue_date = v_today;

  return coalesce(v_next, v_current);
end;
$$;

revoke all on function public.get_today_queue() from public;
revoke all on function public.call_next_patient(uuid) from public;
grant execute on function public.get_today_queue() to anon, authenticated;
grant execute on function public.call_next_patient(uuid) to authenticated;


-- >>> 20261014000000_callback_requests.sql
-- Urgent callback requests from the emergency page.

create table public.callback_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  concern text not null check (char_length(concern) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index callback_requests_status_idx on public.callback_requests (status, created_at desc);

alter table public.callback_requests enable row level security;

create policy "Admins manage callback requests"
on public.callback_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.request_callback(p_name text, p_phone text, p_concern text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_digits) not between 10 and 15
    or char_length(trim(coalesce(p_concern, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  -- One open request per phone number is enough.
  select id into v_id from public.callback_requests
  where status = 'open' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.callback_requests (full_name, phone, concern)
  values (trim(p_name), trim(p_phone), trim(left(p_concern, 500)))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.request_callback(text, text, text) from public;
grant execute on function public.request_callback(text, text, text) to anon, authenticated;


-- >>> 20261015000000_doctor_reviews.sql
-- Verified doctor reviews: only patients with a completed visit can review,
-- and reviews are published after moderation.

create table public.doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  patient_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index doctor_reviews_doctor_idx on public.doctor_reviews (doctor_id, status, created_at desc);

alter table public.doctor_reviews enable row level security;

create policy "Approved reviews are public"
on public.doctor_reviews for select
to anon, authenticated
using (status = 'approved');

create policy "Patients read their own reviews"
on public.doctor_reviews for select
to authenticated
using (patient_id = auth.uid());

create policy "Admins manage reviews"
on public.doctor_reviews for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.submit_review(p_appointment_id uuid, p_rating integer, p_comment text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_name text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'INVALID_RATING' using errcode = 'P0001';
  end if;

  select * into v_appointment from public.appointments a
  where a.id = p_appointment_id and a.patient_id = auth.uid() and a.status = 'completed';
  if not found then
    raise exception 'NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.doctor_reviews r where r.appointment_id = p_appointment_id) then
    raise exception 'ALREADY_REVIEWED' using errcode = 'P0001';
  end if;

  -- Publish only a first name and last initial, e.g. "Maria G."
  select split_part(p.full_name, ' ', 1)
    || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', '')
  into v_name
  from public.patients p where p.user_id = auth.uid();

  insert into public.doctor_reviews (appointment_id, doctor_id, patient_id, author_name, rating, comment)
  values (p_appointment_id, v_appointment.doctor_id, auth.uid(), coalesce(v_name, 'Patient'), p_rating,
    nullif(trim(left(p_comment, 1000)), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.get_doctor_ratings()
returns table (doctor_id uuid, average numeric, total integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.doctor_id, round(avg(r.rating)::numeric, 1), count(*)::integer
  from public.doctor_reviews r
  where r.status = 'approved'
  group by r.doctor_id
$$;

revoke all on function public.submit_review(uuid, integer, text) from public;
revoke all on function public.get_doctor_ratings() from public;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
grant execute on function public.get_doctor_ratings() to anon, authenticated;


-- >>> 20261016000000_doctor_availability.sql
-- Doctor availability: pause new bookings and mark days off (leave).

alter table public.doctors
  add column accepting_appointments boolean not null default true;

create table public.doctor_leaves (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  leave_date date not null,
  reason text check (char_length(reason) <= 120),
  created_at timestamptz not null default now(),
  unique (doctor_id, leave_date)
);

create index doctor_leaves_date_idx on public.doctor_leaves (leave_date);

alter table public.doctor_leaves enable row level security;

create policy "Doctor leave is public"
on public.doctor_leaves for select
to anon, authenticated
using (true);

create policy "Admins manage doctor leave"
on public.doctor_leaves for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Reject bookings while a doctor is paused or on leave.
create or replace function public.check_doctor_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.doctors d where d.id = new.doctor_id and d.accepting_appointments) then
    raise exception 'NOT_ACCEPTING' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.doctor_leaves l where l.doctor_id = new.doctor_id and l.leave_date = new.appointment_date) then
    raise exception 'DOCTOR_ON_LEAVE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger appointments_check_availability
before insert on public.appointments
for each row execute function public.check_doctor_availability();

-- Availability now skips paused doctors and leave days.
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
  join public.doctors doc on doc.id = s.doctor_id and doc.is_active and doc.accepting_appointments
  cross join generate_series(
    public.clinic_today(),
    public.clinic_today() + least(greatest(p_days, 1), 60) - 1,
    interval '1 day'
  ) as d
  where s.doctor_id = p_doctor_id
    and extract(dow from d) = s.weekday
    and not exists (select 1 from public.doctor_leaves l where l.doctor_id = s.doctor_id and l.leave_date = d::date)
    and (
      d::date > public.clinic_today()
      or s.end_time > (now() at time zone 'America/Los_Angeles')::time
    )
  order by d, s.start_time
$$;

-- Who sits on which day: one row per active doctor per date.
create or replace function public.get_doctor_roster(p_from date default null, p_days integer default 14)
returns table (
  roster_date date,
  doctor_id uuid,
  doctor_name text,
  doctor_slug text,
  specialty text,
  status text,
  sessions jsonb,
  leave_reason text,
  accepting boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select d::date as day
    from generate_series(
      coalesce(p_from, public.clinic_today()),
      coalesce(p_from, public.clinic_today()) + least(greatest(p_days, 1), 31) - 1,
      interval '1 day'
    ) d
  )
  select
    days.day,
    doc.id,
    doc.full_name,
    doc.slug,
    doc.specialty,
    case
      when l.id is not null then 'leave'
      when s.sessions is null then 'off'
      else 'available'
    end,
    coalesce(s.sessions, '[]'::jsonb),
    l.reason,
    doc.accepting_appointments
  from days
  cross join public.doctors doc
  left join public.doctor_leaves l on l.doctor_id = doc.id and l.leave_date = days.day
  left join lateral (
    select jsonb_agg(jsonb_build_object('start_time', ds.start_time, 'end_time', ds.end_time) order by ds.start_time) as sessions
    from public.doctor_schedules ds
    where ds.doctor_id = doc.id and ds.weekday = extract(dow from days.day)
  ) s on true
  where doc.is_active
  order by days.day, doc.full_name
$$;

revoke all on function public.get_doctor_roster(date, integer) from public;
grant execute on function public.get_doctor_roster(date, integer) to anon, authenticated;


-- >>> 20261017000000_duty_roster.sql
-- Duty roster: consultant vs intern doctors, and typed duty shifts
-- (on-call, emergency department, ward duty).

alter table public.doctors
  add column kind text not null default 'consultant' check (kind in ('consultant', 'intern'));

alter table public.on_call_shifts
  add column duty_type text not null default 'on_call' check (duty_type in ('on_call', 'emergency', 'ward'));

create index on_call_shifts_type_idx on public.on_call_shifts (duty_type, starts_at);

-- Interns are not bookable; only consultants take appointments.
create or replace function public.check_doctor_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.doctors d
    where d.id = new.doctor_id and d.accepting_appointments and d.kind = 'consultant'
  ) then
    raise exception 'NOT_ACCEPTING' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.doctor_leaves l where l.doctor_id = new.doctor_id and l.leave_date = new.appointment_date) then
    raise exception 'DOCTOR_ON_LEAVE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Roster lists consultants only; interns follow the duty roster.
create or replace function public.get_doctor_roster(p_from date default null, p_days integer default 14)
returns table (
  roster_date date,
  doctor_id uuid,
  doctor_name text,
  doctor_slug text,
  specialty text,
  status text,
  sessions jsonb,
  leave_reason text,
  accepting boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select d::date as day
    from generate_series(
      coalesce(p_from, public.clinic_today()),
      coalesce(p_from, public.clinic_today()) + least(greatest(p_days, 1), 31) - 1,
      interval '1 day'
    ) d
  )
  select
    days.day,
    doc.id,
    doc.full_name,
    doc.slug,
    doc.specialty,
    case
      when l.id is not null then 'leave'
      when s.sessions is null then 'off'
      else 'available'
    end,
    coalesce(s.sessions, '[]'::jsonb),
    l.reason,
    doc.accepting_appointments
  from days
  cross join public.doctors doc
  left join public.doctor_leaves l on l.doctor_id = doc.id and l.leave_date = days.day
  left join lateral (
    select jsonb_agg(jsonb_build_object('start_time', ds.start_time, 'end_time', ds.end_time) order by ds.start_time) as sessions
    from public.doctor_schedules ds
    where ds.doctor_id = doc.id and ds.weekday = extract(dow from days.day)
  ) s on true
  where doc.is_active and doc.kind = 'consultant'
  order by days.day, doc.full_name
$$;



-- >>> 20261018000000_daily_serial_digest.sql
-- Private doctor contact details and a log of daily serial-list emails.

create table public.doctor_contacts (
  doctor_id uuid primary key references public.doctors (id) on delete cascade,
  email text check (char_length(email) <= 254),
  assistant_name text check (char_length(assistant_name) <= 100),
  assistant_email text check (char_length(assistant_email) <= 254),
  updated_at timestamptz not null default now()
);

alter table public.doctor_contacts enable row level security;

create policy "Admins manage doctor contacts"
on public.doctor_contacts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table public.serial_digest_log (
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  digest_date date not null,
  recipients text[] not null,
  appointment_count integer not null,
  sent_at timestamptz not null default now(),
  primary key (doctor_id, digest_date)
);

alter table public.serial_digest_log enable row level security;

create policy "Admins read the digest log"
on public.serial_digest_log for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- >>> 20261019000000_ambulances.sql
-- Ambulance fleet and dispatch.

create table public.ambulances (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 2 and 20),
  vehicle_model text not null check (char_length(vehicle_model) between 2 and 80),
  registration text not null unique check (char_length(registration) between 2 and 20),
  type text not null check (type in ('bls', 'als', 'icu', 'transport', 'neonatal')),
  status text not null default 'available' check (status in ('available', 'on_trip', 'maintenance', 'offline')),
  equipment text[] not null default '{}',
  base_location text check (char_length(base_location) <= 120),
  driver_name text check (char_length(driver_name) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ambulances_set_updated_at
before update on public.ambulances
for each row execute function public.set_updated_at();

alter table public.ambulances enable row level security;

create policy "Ambulance fleet is public"
on public.ambulances for select
to anon, authenticated
using (true);

create policy "Admins manage ambulances"
on public.ambulances for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table public.ambulance_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  pickup_address text not null check (char_length(pickup_address) between 5 and 300),
  details text check (char_length(details) <= 500),
  status text not null default 'pending' check (status in ('pending', 'dispatched', 'completed', 'cancelled')),
  ambulance_id uuid references public.ambulances (id) on delete set null,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

create index ambulance_requests_status_idx on public.ambulance_requests (status, created_at desc);

alter table public.ambulance_requests enable row level security;

create policy "Admins manage ambulance requests"
on public.ambulance_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.request_ambulance(p_name text, p_phone text, p_address text, p_details text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_digits) not between 10 and 15
    or char_length(trim(coalesce(p_address, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  select id into v_id from public.ambulance_requests
  where status = 'pending' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.ambulance_requests (full_name, phone, pickup_address, details)
  values (trim(p_name), trim(p_phone), trim(p_address), nullif(trim(left(p_details, 500)), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Assigns an available ambulance to a pending request in one step.
create or replace function public.dispatch_ambulance(p_request_id uuid, p_ambulance_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update public.ambulances set status = 'on_trip'
  where id = p_ambulance_id and status = 'available';
  if not found then
    raise exception 'AMBULANCE_UNAVAILABLE' using errcode = 'P0001';
  end if;

  update public.ambulance_requests
  set status = 'dispatched', ambulance_id = p_ambulance_id, dispatched_at = now()
  where id = p_request_id and status = 'pending';
  if not found then
    raise exception 'REQUEST_NOT_PENDING' using errcode = 'P0001';
  end if;
end;
$$;

-- Closes a request and returns its ambulance to service.
create or replace function public.close_ambulance_request(p_request_id uuid, p_status text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_ambulance uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_status not in ('completed', 'cancelled') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  update public.ambulance_requests
  set status = p_status, completed_at = now()
  where id = p_request_id and status in ('pending', 'dispatched')
  returning ambulance_id into v_ambulance;
  if not found then
    raise exception 'REQUEST_CLOSED' using errcode = 'P0001';
  end if;

  if v_ambulance is not null then
    update public.ambulances set status = 'available' where id = v_ambulance and status = 'on_trip';
  end if;
end;
$$;

revoke all on function public.request_ambulance(text, text, text, text) from public;
revoke all on function public.dispatch_ambulance(uuid, uuid) from public;
revoke all on function public.close_ambulance_request(uuid, text) from public;
grant execute on function public.request_ambulance(text, text, text, text) to anon, authenticated;
grant execute on function public.dispatch_ambulance(uuid, uuid) to authenticated;
grant execute on function public.close_ambulance_request(uuid, text) to authenticated;


-- >>> 20261020000000_nearby_facilities.sql
-- Nearby hospitals, urgent care centres and clinics for patient referral.

create table public.nearby_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  type text not null check (type in ('hospital', 'urgent_care', 'clinic', 'pharmacy', 'diagnostic')),
  address text not null check (char_length(address) between 5 and 200),
  city text not null check (char_length(city) between 2 and 60),
  phone text check (char_length(phone) between 7 and 25),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  open_24h boolean not null default false,
  has_emergency boolean not null default false,
  services text[] not null default '{}',
  hours text check (char_length(hours) <= 120),
  website text check (website ~ '^https://'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, address)
);

create trigger nearby_facilities_set_updated_at
before update on public.nearby_facilities
for each row execute function public.set_updated_at();

alter table public.nearby_facilities enable row level security;

create policy "Active facilities are public"
on public.nearby_facilities for select
to anon, authenticated
using (is_active or public.is_admin());

create policy "Admins manage facilities"
on public.nearby_facilities for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- >>> 20261021000000_operation_theatres.sql
-- Operation theatres and the live surgery board.

create table public.operation_theatres (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 2 and 20),
  name text not null check (char_length(name) between 2 and 80),
  location text check (char_length(location) <= 80),
  status text not null default 'available' check (status in ('available', 'in_use', 'cleaning', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operation_theatres_set_updated_at
before update on public.operation_theatres
for each row execute function public.set_updated_at();

alter table public.operation_theatres enable row level security;

create policy "Theatre status is public"
on public.operation_theatres for select
to anon, authenticated
using (true);

create policy "Admins manage theatres"
on public.operation_theatres for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create sequence public.surgery_case_seq start 1001;

create table public.surgeries (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique default ('S-' || nextval('public.surgery_case_seq')),
  theatre_id uuid not null references public.operation_theatres (id) on delete restrict,
  surgeon_id uuid not null references public.doctors (id) on delete restrict,
  procedure text not null check (char_length(procedure) between 2 and 120),
  patient_name text not null check (char_length(patient_name) between 2 and 100),
  scheduled_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 15 and 720),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'pre_op', 'in_progress', 'recovery', 'completed', 'delayed', 'cancelled')),
  note text check (char_length(note) <= 200),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index surgeries_schedule_idx on public.surgeries (scheduled_at);
-- A theatre can host only one operation at a time.
create unique index surgeries_one_active_per_theatre on public.surgeries (theatre_id) where status = 'in_progress';

create trigger surgeries_set_updated_at
before update on public.surgeries
for each row execute function public.set_updated_at();

alter table public.surgeries enable row level security;

create policy "Admins manage surgeries"
on public.surgeries for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Stamps start/end times as a case moves through the board.
create or replace function public.stamp_surgery_progress()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'in_progress' and new.started_at is null then
    new.started_at := now();
  end if;
  if new.status in ('recovery', 'completed') and new.ended_at is null then
    new.started_at := coalesce(new.started_at, now());
    new.ended_at := now();
  end if;
  return new;
end;
$$;

create trigger surgeries_stamp_progress
before insert or update of status on public.surgeries
for each row execute function public.stamp_surgery_progress();

-- Keeps the theatre status in step with the case occupying it.
create or replace function public.sync_theatre_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'in_progress' then
    update operation_theatres set status = 'in_use' where id = new.theatre_id;
  elsif tg_op = 'UPDATE' and old.status = 'in_progress' then
    update operation_theatres
    set status = case when new.status in ('recovery', 'completed') then 'cleaning' else 'available' end
    where id = new.theatre_id and status = 'in_use';
  end if;
  return null;
end;
$$;

create trigger surgeries_sync_theatre
after insert or update of status on public.surgeries
for each row execute function public.sync_theatre_status();

-- Public board: no patient details, only the case code given to the family.
create or replace function public.get_ot_board(p_date date default public.clinic_today())
returns table (
  case_code text,
  theatre_code text,
  theatre_name text,
  procedure text,
  surgeon_name text,
  surgeon_specialty text,
  scheduled_at timestamptz,
  duration_minutes integer,
  status text,
  note text,
  started_at timestamptz,
  ended_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.case_code, t.code, t.name, s.procedure, d.full_name, d.specialty,
         s.scheduled_at, s.duration_minutes, s.status, s.note, s.started_at, s.ended_at
  from surgeries s
  join operation_theatres t on t.id = s.theatre_id
  join doctors d on d.id = s.surgeon_id
  where (s.scheduled_at at time zone 'America/Los_Angeles')::date = p_date
  order by s.scheduled_at, t.code;
$$;

grant execute on function public.get_ot_board(date) to anon, authenticated;


-- >>> 20261022000000_integrity_fixes.sql
-- Data-integrity and privacy fixes found in review.

-- ---------------------------------------------------------------------------
-- Reviews: publish only display fields, never patient or appointment ids.
-- ---------------------------------------------------------------------------

drop policy "Approved reviews are public" on public.doctor_reviews;

create view public.published_reviews as
  select id, doctor_id, author_name, rating, comment, created_at
  from public.doctor_reviews
  where status = 'approved';

grant select on public.published_reviews to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Weekly sessions can be retired instead of deleted once they have bookings.
-- ---------------------------------------------------------------------------

alter table public.doctor_schedules add column is_active boolean not null default true;

create or replace function public.check_session_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from doctor_schedules where id = new.schedule_id and is_active) then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger appointments_check_session_active
before insert on public.appointments
for each row execute function public.check_session_active();

-- Only active consultants with active sessions are bookable.
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
  join public.doctors doc
    on doc.id = s.doctor_id and doc.is_active and doc.accepting_appointments and doc.kind = 'consultant'
  cross join generate_series(
    public.clinic_today(),
    public.clinic_today() + least(greatest(p_days, 1), 60) - 1,
    interval '1 day'
  ) as d
  where s.doctor_id = p_doctor_id
    and s.is_active
    and extract(dow from d) = s.weekday
    and not exists (select 1 from public.doctor_leaves l where l.doctor_id = s.doctor_id and l.leave_date = d::date)
    and (
      d::date > public.clinic_today()
      or s.end_time > (now() at time zone 'America/Los_Angeles')::time
    )
  order by d, s.start_time
$$;

-- Today's queue skips retired sessions and doctors on leave.
create or replace function public.get_today_queue()
returns table (
  schedule_id uuid,
  doctor_id uuid,
  doctor_name text,
  doctor_slug text,
  specialty text,
  start_time time,
  end_time time,
  now_serving integer,
  total integer,
  waiting integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    d.id,
    d.full_name,
    d.slug,
    d.specialty,
    s.start_time,
    s.end_time,
    coalesce(q.now_serving, 0),
    (select count(*)::integer from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = public.clinic_today() and a.status <> 'cancelled'),
    (select count(*)::integer from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = public.clinic_today()
        and a.status in ('pending', 'confirmed') and a.serial_no > coalesce(q.now_serving, 0)),
    q.updated_at
  from public.doctor_schedules s
  join public.doctors d on d.id = s.doctor_id and d.is_active
  left join public.queue_state q on q.schedule_id = s.id and q.queue_date = public.clinic_today()
  where s.weekday = extract(dow from public.clinic_today())
    and s.is_active
    and not exists (select 1 from public.doctor_leaves l where l.doctor_id = d.id and l.leave_date = public.clinic_today())
  order by s.start_time, d.full_name
$$;

create or replace function public.get_doctor_roster(p_from date default null, p_days integer default 14)
returns table (
  roster_date date,
  doctor_id uuid,
  doctor_name text,
  doctor_slug text,
  specialty text,
  status text,
  sessions jsonb,
  leave_reason text,
  accepting boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select d::date as day
    from generate_series(
      coalesce(p_from, public.clinic_today()),
      coalesce(p_from, public.clinic_today()) + least(greatest(p_days, 1), 31) - 1,
      interval '1 day'
    ) d
  )
  select
    days.day,
    doc.id,
    doc.full_name,
    doc.slug,
    doc.specialty,
    case
      when l.id is not null then 'leave'
      when s.sessions is null then 'off'
      else 'available'
    end,
    coalesce(s.sessions, '[]'::jsonb),
    l.reason,
    doc.accepting_appointments
  from days
  cross join public.doctors doc
  left join public.doctor_leaves l on l.doctor_id = doc.id and l.leave_date = days.day
  left join lateral (
    select jsonb_agg(jsonb_build_object('start_time', ds.start_time, 'end_time', ds.end_time) order by ds.start_time) as sessions
    from public.doctor_schedules ds
    where ds.doctor_id = doc.id and ds.is_active and ds.weekday = extract(dow from days.day)
  ) s on true
  where doc.is_active and doc.kind = 'consultant'
  order by days.day, doc.full_name
$$;

-- ---------------------------------------------------------------------------
-- Bookings: staff and service jobs may insert without a patient session.
-- ---------------------------------------------------------------------------

create or replace function public.link_appointment_to_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  );
begin
  if v_role = 'service_role' or (auth.uid() is not null and public.is_admin() and new.patient_id is not null) then
    return new;
  end if;
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  new.patient_id := auth.uid();
  return new;
end;
$$;

-- A visit can only be cancelled online before its session starts.
create or replace function public.cancel_my_appointment(p_appointment_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update public.appointments a
  set status = 'cancelled'
  from public.doctor_schedules s
  where a.id = p_appointment_id
    and s.id = a.schedule_id
    and a.patient_id = auth.uid()
    and a.status in ('pending', 'confirmed')
    and (
      a.appointment_date > public.clinic_today()
      or (a.appointment_date = public.clinic_today() and s.start_time > (now() at time zone 'America/Los_Angeles')::time)
    );
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
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
  from public.doctor_schedules s
  where a.reference = upper(trim(p_reference))
    and s.id = a.schedule_id
    and regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and a.status in ('pending', 'confirmed')
    and (
      a.appointment_date > public.clinic_today()
      or (a.appointment_date = public.clinic_today() and s.start_time > (now() at time zone 'America/Los_Angeles')::time)
    );
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ambulances: a vehicle on an open trip cannot be released by hand.
-- ---------------------------------------------------------------------------

create or replace function public.guard_ambulance_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'on_trip' and new.status <> 'on_trip'
     and exists (select 1 from ambulance_requests where ambulance_id = new.id and status = 'dispatched') then
    raise exception 'AMBULANCE_ON_TRIP' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger ambulances_guard_trip
before update of status on public.ambulances
for each row execute function public.guard_ambulance_trip();


-- >>> 20261023000000_public_stats.sql
-- Live figures for the public site and reviews with the doctor they are about.

create or replace view public.published_reviews as
  select r.id, r.doctor_id, r.author_name, r.rating, r.comment, r.created_at,
         d.full_name as doctor_name, d.specialty as doctor_specialty
  from public.doctor_reviews r
  join public.doctors d on d.id = r.doctor_id
  where r.status = 'approved';

create or replace function public.get_public_stats()
returns table (
  doctors integer,
  specialties integer,
  rating numeric,
  reviews integer,
  completed_visits integer,
  ambulances_ready integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from doctors where is_active and kind = 'consultant'),
    (select count(distinct specialty)::integer from doctors where is_active and kind = 'consultant'),
    (select round(avg(rating)::numeric, 1) from doctor_reviews where status = 'approved'),
    (select count(*)::integer from doctor_reviews where status = 'approved'),
    (select count(*)::integer from appointments where status = 'completed'),
    (select count(*)::integer from ambulances where status = 'available');
$$;

revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;


-- >>> 20261024000000_doctor_portal.sql
-- Doctor self-service portal. A doctor signs in with the email saved as their
-- contact email; every function below acts only on that doctor's own records.

create or replace function public.current_doctor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.doctor_id
  from doctor_contacts c
  join doctors d on d.id = c.doctor_id and d.is_active
  where auth.uid() is not null
    and lower(c.email) = (select lower(u.email) from auth.users u where u.id = auth.uid())
  limit 1;
$$;

create or replace function public.require_doctor()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_doctor uuid := public.current_doctor_id();
begin
  if v_doctor is null then
    raise exception 'NOT_A_DOCTOR' using errcode = 'P0001';
  end if;
  return v_doctor;
end;
$$;

create or replace function public.doctor_set_accepting(p_accepting boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update doctors set accepting_appointments = p_accepting where id = public.require_doctor();
end;
$$;

create or replace function public.doctor_add_leave(p_date date, p_reason text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_date < public.clinic_today() then
    raise exception 'INVALID_DATE' using errcode = 'P0001';
  end if;
  insert into doctor_leaves (doctor_id, leave_date, reason)
  values (public.require_doctor(), p_date, nullif(left(trim(coalesce(p_reason, '')), 120), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.doctor_remove_leave(p_leave_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from doctor_leaves where id = p_leave_id and doctor_id = public.require_doctor();
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

create or replace function public.doctor_appointments(p_from date default null, p_days integer default 7)
returns table (
  id uuid,
  appointment_date date,
  start_time time,
  end_time time,
  serial_no integer,
  status public.appointment_status,
  visit_type public.visit_type,
  patient_name text,
  patient_phone text,
  patient_age integer,
  patient_address text,
  reason text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.appointment_date, s.start_time, s.end_time, a.serial_no, a.status, a.visit_type,
         a.patient_name, a.patient_phone, a.patient_age, a.patient_address, a.reason
  from appointments a
  join doctor_schedules s on s.id = a.schedule_id
  where a.doctor_id = public.require_doctor()
    and a.appointment_date between coalesce(p_from, public.clinic_today())
      and coalesce(p_from, public.clinic_today()) + least(greatest(p_days, 1), 31) - 1
  order by a.appointment_date, s.start_time, a.serial_no;
$$;

revoke all on function public.current_doctor_id() from public;
revoke all on function public.require_doctor() from public;
revoke all on function public.doctor_set_accepting(boolean) from public;
revoke all on function public.doctor_add_leave(date, text) from public;
revoke all on function public.doctor_remove_leave(uuid) from public;
revoke all on function public.doctor_appointments(date, integer) from public;
grant execute on function public.current_doctor_id() to authenticated;
grant execute on function public.doctor_set_accepting(boolean) to authenticated;
grant execute on function public.doctor_add_leave(date, text) to authenticated;
grant execute on function public.doctor_remove_leave(uuid) to authenticated;
grant execute on function public.doctor_appointments(date, integer) to authenticated;


-- >>> 20261025000000_doctor_applications.sql
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


-- >>> 20261026000000_request_dedupe.sql
-- Callback and ambulance requests report whether a new row was created, so a
-- repeat submission from the same phone does not alert staff twice. A per-phone
-- advisory lock stops two simultaneous submissions from both inserting.

drop function if exists public.request_callback(text, text, text);
drop function if exists public.request_ambulance(text, text, text, text);

create function public.request_callback(p_name text, p_phone text, p_concern text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_digits) not between 10 and 15
    or char_length(trim(coalesce(p_concern, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('callback:' || v_digits));

  -- One open request per phone number is enough.
  select id into v_id from public.callback_requests
  where status = 'open' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return jsonb_build_object('id', v_id, 'created', false);
  end if;

  insert into public.callback_requests (full_name, phone, concern)
  values (trim(p_name), trim(p_phone), trim(left(p_concern, 500)))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'created', true);
end;
$$;

create function public.request_ambulance(p_name text, p_phone text, p_address text, p_details text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_digits) not between 10 and 15
    or char_length(trim(coalesce(p_address, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('ambulance:' || v_digits));

  -- A pending request from the same phone is already in the dispatch queue.
  select id into v_id from public.ambulance_requests
  where status = 'pending' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return jsonb_build_object('id', v_id, 'created', false);
  end if;

  insert into public.ambulance_requests (full_name, phone, pickup_address, details)
  values (trim(p_name), trim(p_phone), trim(p_address), nullif(trim(left(p_details, 500)), ''))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'created', true);
end;
$$;

revoke all on function public.request_callback(text, text, text) from public;
revoke all on function public.request_ambulance(text, text, text, text) from public;
grant execute on function public.request_callback(text, text, text) to anon, authenticated;
grant execute on function public.request_ambulance(text, text, text, text) to anon, authenticated;


-- >>> 20261027000000_timed_serials.sql
-- Serial numbers follow the clock. A session is split into max_patients equal
-- slots, and serial k is slot k: in a 9:00–13:00 session for 16 patients,
-- #1 reports at 9:00, #2 at 9:15 and so on. Booking takes the earliest free
-- slot, so a cancelled slot is offered again and a serial never falls outside
-- its session. Each appointment stores its reporting time, so a later schedule
-- edit does not move a time a patient was already given.

-- Reporting time of a serial, rounded down to the minute.
create or replace function public.serial_time(p_start time, p_end time, p_max integer, p_serial integer)
returns time
language sql
immutable
as $$
  select p_start + make_interval(
    mins => floor(extract(epoch from (p_end - p_start)) / 60 / greatest(p_max, 1) * (p_serial - 1))::integer
  )
$$;

alter table public.appointments add column reporting_time time;

update public.appointments a
set reporting_time = public.serial_time(s.start_time, s.end_time, s.max_patients, least(a.serial_no, s.max_patients))
from public.doctor_schedules s
where s.id = a.schedule_id;

-- A cancelled visit gives its serial back, so only active visits hold one.
alter table public.appointments drop constraint if exists appointments_schedule_id_appointment_date_serial_no_key;
create unique index appointments_active_serial_idx
  on public.appointments (schedule_id, appointment_date, serial_no)
  where status <> 'cancelled';

-- Serials still open for booking, earliest first. Today it skips slots whose
-- time has passed and serials the live queue has already called.
create or replace function public.free_serials(p_schedule_id uuid, p_date date)
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select k
  from public.doctor_schedules s
  cross join generate_series(1, s.max_patients) as k
  where s.id = p_schedule_id
    and not exists (
      select 1 from public.appointments a
      where a.schedule_id = s.id and a.appointment_date = p_date and a.serial_no = k and a.status <> 'cancelled'
    )
    and (
      p_date > public.clinic_today()
      or (
        public.serial_time(s.start_time, s.end_time, s.max_patients, k)
          >= (now() at time zone 'America/Los_Angeles')::time
        and k > coalesce(
          (select q.now_serving from public.queue_state q where q.schedule_id = s.id and q.queue_date = p_date), 0
        )
      )
    )
  order by k
$$;

drop function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text);
drop function public.lookup_appointment(text, text);
drop function public.doctor_appointments(date, integer);

create function public.book_appointment(
  p_schedule_id uuid,
  p_date date,
  p_name text,
  p_phone text,
  p_email text default null,
  p_age integer default null,
  p_gender text default null,
  p_reason text default null,
  p_visit_type public.visit_type default 'in_clinic',
  p_address text default null
)
returns table (
  reference text,
  serial_no integer,
  reporting_time time,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text,
  visit_type public.visit_type
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
  v_serial integer;
  v_time time;
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

  if p_visit_type is null or not (p_visit_type = any (v_doctor.visit_types)) then
    raise exception 'VISIT_TYPE_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if p_visit_type = 'home_visit' and char_length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'ADDRESS_REQUIRED' using errcode = 'P0001';
  end if;

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

  select min(k) into v_serial from public.free_serials(p_schedule_id, p_date) as k;
  if v_serial is null then
    raise exception 'SESSION_FULL' using errcode = 'P0001';
  end if;
  v_time := public.serial_time(v_schedule.start_time, v_schedule.end_time, v_schedule.max_patients, v_serial);

  v_reference := 'DHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.appointments (
    reference, doctor_id, schedule_id, appointment_date, serial_no, reporting_time, visit_type, patient_address,
    patient_name, patient_phone, patient_email, patient_age, patient_gender, reason
  ) values (
    v_reference, v_doctor.id, v_schedule.id, p_date, v_serial, v_time, p_visit_type,
    case when p_visit_type = 'home_visit' then trim(p_address) end,
    trim(p_name), trim(p_phone), nullif(trim(p_email), ''), p_age, nullif(p_gender, ''), nullif(trim(p_reason), '')
  );

  return query select v_reference, v_serial, v_time, p_date, v_schedule.start_time, v_schedule.end_time,
    v_doctor.full_name, v_doctor.specialty, p_visit_type;
end;
$$;

create function public.lookup_appointment(p_reference text, p_phone text)
returns table (
  reference text,
  status public.appointment_status,
  serial_no integer,
  reporting_time time,
  appointment_date date,
  start_time time,
  end_time time,
  doctor_name text,
  specialty text,
  visit_type public.visit_type
)
language sql
stable
security definer
set search_path = public
as $$
  select a.reference, a.status, a.serial_no, a.reporting_time, a.appointment_date, s.start_time, s.end_time,
    d.full_name, d.specialty, a.visit_type
  from public.appointments a
  join public.doctor_schedules s on s.id = a.schedule_id
  join public.doctors d on d.id = a.doctor_id
  where a.reference = upper(trim(p_reference))
    and regexp_replace(a.patient_phone, '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
$$;

create function public.doctor_appointments(p_from date default null, p_days integer default 7)
returns table (
  id uuid,
  appointment_date date,
  start_time time,
  end_time time,
  serial_no integer,
  reporting_time time,
  status public.appointment_status,
  visit_type public.visit_type,
  patient_name text,
  patient_phone text,
  patient_age integer,
  patient_address text,
  reason text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.appointment_date, s.start_time, s.end_time, a.serial_no, a.reporting_time, a.status, a.visit_type,
         a.patient_name, a.patient_phone, a.patient_age, a.patient_address, a.reason
  from appointments a
  join doctor_schedules s on s.id = a.schedule_id
  where a.doctor_id = public.require_doctor()
    and a.appointment_date between coalesce(p_from, public.clinic_today())
      and coalesce(p_from, public.clinic_today()) + least(greatest(p_days, 1), 31) - 1
  order by a.appointment_date, s.start_time, a.serial_no;
$$;

-- Reopening a cancelled visit keeps its serial when that slot is still free,
-- otherwise it moves to the earliest free slot. A full session refuses it.
create or replace function public.reassign_reopened_serial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule public.doctor_schedules%rowtype;
  v_serial integer;
begin
  if old.status <> 'cancelled' or new.status = 'cancelled' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.schedule_id::text || ':' || new.appointment_date::text));
  select * into v_schedule from public.doctor_schedules s where s.id = new.schedule_id;

  if not exists (
    select 1 from public.appointments a
    where a.schedule_id = new.schedule_id and a.appointment_date = new.appointment_date
      and a.serial_no = new.serial_no and a.status <> 'cancelled' and a.id <> new.id
  ) and new.serial_no <= v_schedule.max_patients then
    return new;
  end if;

  select min(k) into v_serial
  from generate_series(1, v_schedule.max_patients) as k
  where not exists (
    select 1 from public.appointments a
    where a.schedule_id = new.schedule_id and a.appointment_date = new.appointment_date
      and a.serial_no = k and a.status <> 'cancelled' and a.id <> new.id
  );
  if v_serial is null then
    raise exception 'SESSION_FULL' using errcode = 'P0001';
  end if;

  new.serial_no := v_serial;
  new.reporting_time := public.serial_time(v_schedule.start_time, v_schedule.end_time, v_schedule.max_patients, v_serial);
  return new;
end;
$$;

create trigger appointments_reassign_reopened_serial
before update of status on public.appointments
for each row execute function public.reassign_reopened_serial();

-- Remaining spots count only slots that can still be booked.
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
    s.max_patients - (select count(*)::integer from public.free_serials(s.id, d::date))
  from public.doctor_schedules s
  join public.doctors doc
    on doc.id = s.doctor_id and doc.is_active and doc.accepting_appointments and doc.kind = 'consultant'
  cross join generate_series(
    public.clinic_today(),
    public.clinic_today() + least(greatest(p_days, 1), 60) - 1,
    interval '1 day'
  ) as d
  where s.doctor_id = p_doctor_id
    and s.is_active
    and extract(dow from d) = s.weekday
    and not exists (select 1 from public.doctor_leaves l where l.doctor_id = s.doctor_id and l.leave_date = d::date)
    and (
      d::date > public.clinic_today()
      or s.end_time > (now() at time zone 'America/Los_Angeles')::time
    )
  order by d, s.start_time
$$;

revoke all on function public.free_serials(uuid, date) from public;
revoke all on function public.reassign_reopened_serial() from public;
revoke all on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) from public;
revoke all on function public.lookup_appointment(text, text) from public;
revoke all on function public.doctor_appointments(date, integer) from public;
grant execute on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) to authenticated;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;
grant execute on function public.doctor_appointments(date, integer) to authenticated;


-- >>> seed.sql
-- Sample data for local development and first launch.
-- Replace these doctors with your real team from the admin dashboard.

insert into public.doctors (slug, full_name, specialty, qualification, experience_years, bio, consultation_fee, languages, room)
values
  ('sarah-johnson', 'Dr. Sarah Johnson', 'Geriatric Medicine', 'MD, Board Certified in Geriatrics', 20,
   'Medical Director focused on comprehensive care for older adults, chronic disease management and care coordination.',
   150, array['English'], 'Room 101'),
  ('michael-patel', 'Dr. Michael Patel', 'Internal Medicine', 'MD, FACP', 15,
   'Internist experienced in diabetes, hypertension and preventive care for adults of all ages.',
   140, array['English', 'Hindi'], 'Room 102'),
  ('emily-nguyen', 'Dr. Emily Nguyen', 'Cardiology', 'MD, FACC', 12,
   'Cardiologist specializing in heart failure management and post-hospital cardiac follow-up.',
   180, array['English', 'Vietnamese'], 'Room 201'),
  ('daniel-ramirez', 'Dr. Daniel Ramirez', 'Family Medicine', 'MD, Board Certified in Family Medicine', 10,
   'Family physician providing whole-person care, from routine check-ups to chronic condition follow-up.',
   120, array['English', 'Spanish'], 'Room 103'),
  ('aisha-rahman', 'Dr. Aisha Rahman', 'Endocrinology', 'MD, Board Certified in Endocrinology', 9,
   'Endocrinologist helping patients manage diabetes, thyroid disorders and metabolic health.',
   170, array['English', 'Bengali'], 'Room 202'),
  ('james-chen', 'James Chen, DPT', 'Physical Therapy', 'Doctor of Physical Therapy', 11,
   'Lead physical therapist dedicated to helping patients regain mobility, balance and independence.',
   110, array['English', 'Mandarin'], 'Rehab Suite');

update public.doctors set visit_types = case slug
  when 'sarah-johnson' then array['in_clinic', 'video', 'home_visit']::public.visit_type[]
  when 'james-chen' then array['in_clinic', 'home_visit']::public.visit_type[]
  when 'emily-nguyen' then array['in_clinic']::public.visit_type[]
  else array['in_clinic', 'video']::public.visit_type[]
end;

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time, max_patients)
select d.id, s.weekday, s.start_time::time, s.end_time::time, s.max_patients
from (values
  ('sarah-johnson', 1, '09:00', '13:00', 16),
  ('sarah-johnson', 3, '09:00', '13:00', 16),
  ('sarah-johnson', 5, '14:00', '17:00', 12),
  ('michael-patel', 1, '14:00', '18:00', 20),
  ('michael-patel', 2, '09:00', '13:00', 20),
  ('michael-patel', 4, '09:00', '13:00', 20),
  ('emily-nguyen', 2, '14:00', '17:00', 10),
  ('emily-nguyen', 4, '14:00', '17:00', 10),
  ('daniel-ramirez', 1, '08:00', '12:00', 24),
  ('daniel-ramirez', 3, '13:00', '17:00', 24),
  ('daniel-ramirez', 6, '09:00', '12:00', 15),
  ('aisha-rahman', 2, '09:00', '12:00', 12),
  ('aisha-rahman', 5, '09:00', '12:00', 12),
  ('james-chen', 1, '10:00', '16:00', 12),
  ('james-chen', 3, '10:00', '16:00', 12),
  ('james-chen', 5, '10:00', '16:00', 12)
) as s (slug, weekday, start_time, end_time, max_patients)
join public.doctors d on d.slug = s.slug;

-- Rotating 12-hour on-call shifts for the next two weeks (Pacific time).
insert into public.on_call_shifts (doctor_id, starts_at, ends_at, note)
select
  d.id,
  (day + shift.start_offset) at time zone 'America/Los_Angeles',
  (day + shift.start_offset + interval '12 hours') at time zone 'America/Los_Angeles',
  shift.label
from generate_series(
  date_trunc('day', now() at time zone 'America/Los_Angeles'),
  date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '13 days',
  interval '1 day'
) as day
cross join (values (interval '8 hours', 'Day shift', 0), (interval '20 hours', 'Night shift', 1)) as shift (start_offset, label, idx)
join lateral (
  select id
  from public.doctors
  where slug = (array['sarah-johnson', 'michael-patel', 'daniel-ramirez', 'emily-nguyen'])[
    1 + ((extract(doy from day)::integer * 2 + shift.idx) % 4)
  ]
) as d on true;

-- Intern doctors and their ward / emergency duty (Pacific time).
insert into public.doctors (slug, full_name, specialty, qualification, kind, accepting_appointments, languages, bio)
values
  ('aiden-brooks', 'Dr. Aiden Brooks', 'Internal Medicine', 'MBBS, Intern', 'intern', false, array['English'],
   'Intern doctor rotating through internal medicine and the emergency department.'),
  ('fatima-noor', 'Dr. Fatima Noor', 'Family Medicine', 'MBBS, Intern', 'intern', false, array['English', 'Urdu'],
   'Intern doctor supporting family medicine clinics and ward rounds.'),
  ('lucas-mendes', 'Dr. Lucas Mendes', 'Geriatric Medicine', 'MD, Intern', 'intern', false, array['English', 'Portuguese'],
   'Intern doctor on the geriatric care team.');

insert into public.on_call_shifts (doctor_id, starts_at, ends_at, note, duty_type)
select
  d.id,
  (day + shift.start_offset) at time zone 'America/Los_Angeles',
  (day + shift.start_offset + shift.length) at time zone 'America/Los_Angeles',
  shift.label,
  shift.duty
from generate_series(
  date_trunc('day', now() at time zone 'America/Los_Angeles'),
  date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '13 days',
  interval '1 day'
) as day
cross join (values
  (interval '8 hours', interval '8 hours', 'Morning ward', 'ward', 0),
  (interval '16 hours', interval '8 hours', 'Evening emergency', 'emergency', 1),
  (interval '0 hours', interval '8 hours', 'Night emergency', 'emergency', 2)
) as shift (start_offset, length, label, duty, idx)
join lateral (
  select id from public.doctors
  where slug = (array['aiden-brooks', 'fatima-noor', 'lucas-mendes'])[1 + ((extract(doy from day)::integer + shift.idx) % 3)]
) as d on true;

-- Sample doctor and compounder contacts for the daily serial email.
insert into public.doctor_contacts (doctor_id, email, assistant_name, assistant_email)
select id, slug || '@example.com', 'Front desk', 'frontdesk@example.com'
from public.doctors
where kind = 'consultant';

-- Sample ambulance fleet.
insert into public.ambulances (code, vehicle_model, registration, type, status, equipment, base_location, driver_name)
values
  ('AMB-01', 'Ford E-450 Type III', '8ABC123', 'als', 'available',
   array['Cardiac monitor', 'Defibrillator', 'Ventilator', 'Oxygen', 'IV supplies'], 'Fresno main station', 'Carlos Vega'),
  ('AMB-02', 'Mercedes-Benz Sprinter 3500', '8DEF456', 'bls', 'available',
   array['AED', 'Oxygen', 'Stretcher', 'First aid kit'], 'Fresno main station', 'Linda Park'),
  ('AMB-03', 'Ram ProMaster 3500', '8GHI789', 'transport', 'on_trip',
   array['Wheelchair lift', 'Stretcher', 'Oxygen'], 'Clovis satellite', 'Marcus Lee'),
  ('AMB-04', 'Ford F-550 Type I', '8JKL012', 'icu', 'available',
   array['Ventilator', 'Infusion pumps', 'Cardiac monitor', 'Defibrillator', 'Suction unit'], 'Fresno main station', 'Priya Nair'),
  ('AMB-05', 'Chevrolet G4500 Type III', '8MNO345', 'neonatal', 'maintenance',
   array['Transport incubator', 'Neonatal ventilator', 'Oxygen'], 'Fresno main station', null);

-- AMB-03 is out on a scheduled transfer.
insert into public.ambulance_requests (full_name, phone, pickup_address, details, status, ambulance_id, dispatched_at)
select 'Walter Brooks', '(559) 555-0142', '4410 N Cedar Ave, Fresno, CA 93726', 'Dialysis transfer', 'dispatched', id, now()
from public.ambulances
where code = 'AMB-03';

-- Nearby facilities
insert into public.nearby_facilities
  (name, type, address, city, phone, latitude, longitude, open_24h, has_emergency, services, hours, website)
values
  ('Community Regional Medical Center', 'hospital', '2823 Fresno St, Fresno, CA 93721', 'Fresno', '(559) 459-7435',
   36.7432, -119.7838, true, true, array['Level I trauma center', 'Burn unit', 'Stroke center'], null, 'https://www.communitymedical.org'),
  ('Saint Agnes Medical Center', 'hospital', '1303 E Herndon Ave, Fresno, CA 93720', 'Fresno', '(559) 450-3205',
   36.8372, -119.7706, true, true, array['Cardiac care', 'Stroke center', 'Maternity'], null, 'https://www.samc.com'),
  ('Kaiser Permanente Fresno Medical Center', 'hospital', '7300 N Fresno St, Fresno, CA 93720', 'Fresno', '(559) 448-3152',
   36.8415, -119.7826, true, true, array['Emergency', 'Surgery', 'Maternity'], null, 'https://healthy.kaiserpermanente.org'),
  ('Clovis Community Medical Center', 'hospital', '2755 Herndon Ave, Clovis, CA 93611', 'Clovis', '(559) 324-4000',
   36.8366, -119.6855, true, true, array['Emergency', 'Cancer institute', 'Maternity'], null, 'https://www.communitymedical.org'),
  ('AFC Urgent Care Fresno', 'urgent_care', '3656 W Shaw Ave, Fresno, CA 93711', 'Fresno', '(559) 388-8430',
   36.8079, -119.8615, false, false, array['Walk-in care', 'X-ray', 'Lab tests'], null, 'https://www.afcurgentcare.com/fresno'),
  ('Accelerated Urgent Care', 'urgent_care', '761 W Shaw Ave, Fresno, CA 93704', 'Fresno', '(559) 712-7272',
   36.8083, -119.8020, false, false, array['Walk-in care', 'Minor injuries'], null, null),
  ('Everyday Healthcare', 'clinic', '4177 W Shaw Ave Ste 107, Fresno, CA 93722', 'Fresno', '(559) 225-4706',
   36.8079, -119.8720, false, false, array['Primary care', 'Physicals'], null, null),
  ('Clovis Urgent Care', 'urgent_care', '1555 Shaw Ave Ste 101, Clovis, CA 93611', 'Clovis', '(559) 324-7001',
   36.8086, -119.6900, false, false, array['Walk-in care', 'Minor injuries'], null, null);

-- Operation theatres and today's surgery list
insert into public.operation_theatres (code, name, location, status) values
  ('OT-1', 'General Surgery Theatre', 'Level 2, East wing', 'available'),
  ('OT-2', 'Cardiac & Vascular Theatre', 'Level 2, West wing', 'available'),
  ('OT-3', 'Day Surgery Theatre', 'Ground floor', 'maintenance');

with today as (select public.clinic_today() as d)
insert into public.surgeries
  (theatre_id, surgeon_id, procedure, patient_name, scheduled_at, duration_minutes, status, started_at, ended_at, note)
select t.id, d.id, v.procedure, v.patient, (today.d + v.at) at time zone 'America/Los_Angeles', v.minutes, v.status,
       case when v.status in ('recovery', 'completed') then (today.d + v.at) at time zone 'America/Los_Angeles' end,
       case when v.status in ('recovery', 'completed') then (today.d + v.at) at time zone 'America/Los_Angeles' + make_interval(mins => v.minutes) end,
       v.note
from today,
  (values
    ('OT-1', 'michael-patel', 'Laparoscopic cholecystectomy', 'Robert Hayes', time '08:00', 90, 'completed', null),
    ('OT-2', 'emily-nguyen', 'Coronary angioplasty', 'Linda Moore', time '09:00', 120, 'recovery', null),
    ('OT-1', 'daniel-ramirez', 'Hernia repair', 'James Carter', time '11:30', 75, 'scheduled', null),
    ('OT-2', 'emily-nguyen', 'Pacemaker implantation', 'Patricia Lee', time '14:00', 90, 'scheduled', null),
    ('OT-1', 'sarah-johnson', 'Hip fracture fixation', 'Dorothy Evans', time '15:30', 120, 'delayed', 'Waiting on pre-op labs')
  ) as v(theatre, surgeon, procedure, patient, at, minutes, status, note)
join public.operation_theatres t on t.code = v.theatre
join public.doctors d on d.slug = v.surgeon
order by v.at;

update public.operation_theatres set status = 'cleaning' where code = 'OT-2';
