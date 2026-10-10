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
