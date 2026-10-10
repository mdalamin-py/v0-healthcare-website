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
