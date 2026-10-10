-- Patient accounts: profiles linked to Supabase Auth users. Booking now
-- requires a signed-in patient, and patients can see their own appointments.

create table public.patients (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  email text check (char_length(email) <= 254),
  date_of_birth date check (date_of_birth <= current_date),
  gender text check (gender in ('female', 'male', 'other')),
  address text check (char_length(address) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

alter table public.patients enable row level security;

create policy "Patients manage their own profile"
on public.patients for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Admins read patient profiles"
on public.patients for select
to authenticated
using (public.is_admin());

alter table public.appointments
  add column patient_id uuid references auth.users (id) on delete set null;

create index appointments_patient_idx on public.appointments (patient_id, appointment_date desc);

create policy "Patients read their own appointments"
on public.appointments for select
to authenticated
using (patient_id = auth.uid());

-- Require a signed-in patient and link the booking to their account.
create or replace function public.link_appointment_to_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  new.patient_id := auth.uid();
  return new;
end;
$$;

create trigger appointments_link_patient
before insert on public.appointments
for each row execute function public.link_appointment_to_patient();

revoke execute on function public.book_appointment(uuid, date, text, text, text, integer, text, text, public.visit_type, text) from anon;

create or replace function public.cancel_my_appointment(p_appointment_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  update public.appointments a
  set status = 'cancelled'
  where a.id = p_appointment_id
    and a.patient_id = auth.uid()
    and a.status in ('pending', 'confirmed')
    and a.appointment_date >= public.clinic_today();
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.cancel_my_appointment(uuid) from public;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
