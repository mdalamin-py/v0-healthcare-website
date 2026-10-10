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
