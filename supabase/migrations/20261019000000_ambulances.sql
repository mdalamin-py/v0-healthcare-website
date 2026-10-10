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
