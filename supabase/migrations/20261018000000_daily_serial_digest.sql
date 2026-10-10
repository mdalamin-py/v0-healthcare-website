-- Private doctor contact details and a log of daily serial-list emails.

create table public.doctor_contacts (
  doctor_id uuid primary key references public.doctors (id) on delete cascade,
  email text check (char_length(email) <= 254),
  assistant_name text check (char_length(assistant_name) <= 100),
  assistant_email text check (char_length(assistant_email) <= 254),
  updated_at timestamptz not null default now()
);

alter table public.doctor_contacts enable row level security;

create policy "Admins manage doctor contacts"
on public.doctor_contacts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table public.serial_digest_log (
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  digest_date date not null,
  recipients text[] not null,
  appointment_count integer not null,
  sent_at timestamptz not null default now(),
  primary key (doctor_id, digest_date)
);

alter table public.serial_digest_log enable row level security;

create policy "Admins read the digest log"
on public.serial_digest_log for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
