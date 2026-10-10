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
