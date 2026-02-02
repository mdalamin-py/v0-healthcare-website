-- Core tables for Healthcare Management System

create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'patient',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Doctors table
create table if not exists public.doctors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  doctor_id text unique,
  full_name text not null,
  email text,
  phone text,
  specialty text not null,
  qualification text,
  experience_years integer default 0,
  bio text,
  avatar_url text,
  consultation_fee decimal(10,2) default 150,
  available_days text[] default array['Monday','Tuesday','Wednesday','Thursday','Friday'],
  available_from time default '09:00',
  available_to time default '17:00',
  is_active boolean default true,
  rating decimal(2,1) default 5.0,
  created_at timestamptz default now()
);

-- Patients table
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  patient_id text unique,
  full_name text not null,
  email text,
  phone text not null,
  date_of_birth date,
  gender text,
  blood_group text,
  address text,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  allergies text[],
  primary_doctor_id uuid references public.doctors(id),
  created_at timestamptz default now()
);

-- Appointments table
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  appointment_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  appointment_date date not null,
  start_time time not null,
  appointment_type text default 'in_person',
  status text default 'scheduled',
  reason text,
  notes text,
  diagnosis text,
  created_at timestamptz default now()
);

-- Prescriptions table
create table if not exists public.prescriptions (
  id uuid primary key default uuid_generate_v4(),
  prescription_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  diagnosis text,
  notes text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Prescription items
create table if not exists public.prescription_items (
  id uuid primary key default uuid_generate_v4(),
  prescription_id uuid references public.prescriptions(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text,
  instructions text,
  created_at timestamptz default now()
);

-- Ambulances table
create table if not exists public.ambulances (
  id uuid primary key default uuid_generate_v4(),
  ambulance_id text unique,
  vehicle_number text not null unique,
  vehicle_type text default 'Basic Life Support',
  driver_name text,
  driver_phone text,
  paramedic_name text,
  status text default 'available',
  current_lat decimal(10,8),
  current_lng decimal(11,8),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Emergency requests
create table if not exists public.emergency_requests (
  id uuid primary key default uuid_generate_v4(),
  request_id text unique,
  patient_name text not null,
  patient_phone text not null,
  emergency_type text not null,
  severity text default 'moderate',
  description text,
  pickup_address text not null,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  ambulance_id uuid references public.ambulances(id),
  status text default 'pending',
  created_at timestamptz default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id),
  subtotal decimal(10,2) not null,
  tax decimal(10,2) default 0,
  discount decimal(10,2) default 0,
  total decimal(10,2) not null,
  paid_amount decimal(10,2) default 0,
  status text default 'pending',
  due_date date,
  created_at timestamptz default now()
);

-- Invoice items
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer default 1,
  unit_price decimal(10,2) not null,
  total decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  payment_id text unique,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_method text default 'cash',
  status text default 'completed',
  created_at timestamptz default now()
);

-- Vitals
create table if not exists public.vitals (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature decimal(4,1),
  oxygen_saturation integer,
  weight decimal(5,2),
  recorded_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info',
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

-- Services
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  description text,
  price decimal(10,2),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Doctor reviews
create table if not exists public.doctor_reviews (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  patient_id uuid references public.patients(id),
  rating integer not null,
  review text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.ambulances enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.vitals enable row level security;
alter table public.notifications enable row level security;
alter table public.services enable row level security;
alter table public.doctor_reviews enable row level security;

-- Basic RLS policies
create policy "public_read_doctors" on public.doctors for select using (true);
create policy "public_read_services" on public.services for select using (true);
create policy "public_read_ambulances" on public.ambulances for select using (true);
create policy "public_read_reviews" on public.doctor_reviews for select using (true);
create policy "auth_all_profiles" on public.profiles for all using (auth.uid() = id);
create policy "auth_read_notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "auth_update_notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "insert_patients" on public.patients for insert with check (true);
create policy "insert_appointments" on public.appointments for insert with check (true);
create policy "insert_emergency" on public.emergency_requests for insert with check (true);
create policy "insert_notifications" on public.notifications for insert with check (true);
create policy "select_patients" on public.patients for select using (true);
create policy "select_appointments" on public.appointments for select using (true);
create policy "select_prescriptions" on public.prescriptions for select using (true);
create policy "select_prescription_items" on public.prescription_items for select using (true);
create policy "select_emergency" on public.emergency_requests for select using (true);
create policy "select_invoices" on public.invoices for select using (true);
create policy "select_invoice_items" on public.invoice_items for select using (true);
create policy "select_payments" on public.payments for select using (true);
create policy "select_vitals" on public.vitals for select using (true);
create policy "insert_prescriptions" on public.prescriptions for insert with check (true);
create policy "insert_prescription_items" on public.prescription_items for insert with check (true);
create policy "insert_invoices" on public.invoices for insert with check (true);
create policy "insert_invoice_items" on public.invoice_items for insert with check (true);
create policy "insert_payments" on public.payments for insert with check (true);
create policy "insert_vitals" on public.vitals for insert with check (true);
create policy "insert_reviews" on public.doctor_reviews for insert with check (true);
create policy "update_patients" on public.patients for update using (true);
create policy "update_appointments" on public.appointments for update using (true);
create policy "update_prescriptions" on public.prescriptions for update using (true);
create policy "update_emergency" on public.emergency_requests for update using (true);
create policy "update_invoices" on public.invoices for update using (true);
create policy "update_ambulances" on public.ambulances for update using (true);
create policy "insert_doctors" on public.doctors for insert with check (true);
create policy "update_doctors" on public.doctors for update using (true);
create policy "insert_ambulances" on public.ambulances for insert with check (true);
create policy "insert_services" on public.services for insert with check (true);
create policy "update_services" on public.services for update using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'patient')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
