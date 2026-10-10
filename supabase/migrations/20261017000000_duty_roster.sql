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

