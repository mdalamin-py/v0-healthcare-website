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
