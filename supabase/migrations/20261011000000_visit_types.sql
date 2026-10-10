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
