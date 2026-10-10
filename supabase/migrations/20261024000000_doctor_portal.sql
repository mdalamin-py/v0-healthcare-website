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
