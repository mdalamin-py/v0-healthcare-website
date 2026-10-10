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
