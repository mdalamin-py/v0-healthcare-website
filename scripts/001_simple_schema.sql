-- Healthcare Management System Schema
-- Simple version for initial setup

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'patient' check (role in ('admin', 'doctor', 'nurse', 'staff', 'patient')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Doctors table
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  specialty text,
  qualification text,
  experience_years integer default 0,
  bio text,
  avatar_url text,
  consultation_fee decimal(10,2) default 0,
  is_available boolean default true,
  rating decimal(3,2) default 5.0,
  total_reviews integer default 0,
  working_hours jsonb default '{"mon": "9:00-17:00", "tue": "9:00-17:00", "wed": "9:00-17:00", "thu": "9:00-17:00", "fri": "9:00-17:00"}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.doctors enable row level security;
create policy "doctors_select" on public.doctors for select using (true);
create policy "doctors_insert" on public.doctors for insert with check (true);
create policy "doctors_update" on public.doctors for update using (true);

-- Patients table
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  patient_id text unique,
  name text not null,
  email text,
  phone text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  blood_group text,
  address text,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_policy_number text,
  medical_history text,
  allergies text,
  current_medications text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.patients enable row level security;
create policy "patients_select" on public.patients for select using (true);
create policy "patients_insert" on public.patients for insert with check (true);
create policy "patients_update" on public.patients for update using (true);

-- Appointments table
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes integer default 30,
  type text default 'consultation' check (type in ('consultation', 'follow_up', 'emergency', 'checkup', 'procedure', 'home_visit')),
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason text,
  notes text,
  fee decimal(10,2) default 0,
  is_paid boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.appointments enable row level security;
create policy "appointments_select" on public.appointments for select using (true);
create policy "appointments_insert" on public.appointments for insert with check (true);
create policy "appointments_update" on public.appointments for update using (true);

-- Prescriptions table
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  prescription_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  diagnosis text,
  medications jsonb default '[]',
  instructions text,
  follow_up_date date,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prescriptions enable row level security;
create policy "prescriptions_select" on public.prescriptions for select using (true);
create policy "prescriptions_insert" on public.prescriptions for insert with check (true);
create policy "prescriptions_update" on public.prescriptions for update using (true);

-- Ambulances table
create table if not exists public.ambulances (
  id uuid primary key default gen_random_uuid(),
  vehicle_number text unique not null,
  vehicle_type text default 'basic' check (vehicle_type in ('basic', 'advanced', 'icu', 'neonatal')),
  driver_name text,
  driver_phone text,
  status text default 'available' check (status in ('available', 'on_call', 'maintenance', 'offline')),
  current_location text,
  equipment jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ambulances enable row level security;
create policy "ambulances_select" on public.ambulances for select using (true);
create policy "ambulances_insert" on public.ambulances for insert with check (true);
create policy "ambulances_update" on public.ambulances for update using (true);

-- Emergency Requests table
create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text unique,
  patient_id uuid references public.patients(id) on delete set null,
  ambulance_id uuid references public.ambulances(id) on delete set null,
  caller_name text not null,
  caller_phone text not null,
  pickup_address text not null,
  destination text,
  emergency_type text default 'medical' check (emergency_type in ('medical', 'accident', 'cardiac', 'respiratory', 'other')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text default 'pending' check (status in ('pending', 'dispatched', 'en_route', 'arrived', 'transporting', 'completed', 'cancelled')),
  notes text,
  dispatched_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.emergency_requests enable row level security;
create policy "emergency_select" on public.emergency_requests for select using (true);
create policy "emergency_insert" on public.emergency_requests for insert with check (true);
create policy "emergency_update" on public.emergency_requests for update using (true);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  items jsonb default '[]',
  subtotal decimal(10,2) default 0,
  tax decimal(10,2) default 0,
  discount decimal(10,2) default 0,
  total decimal(10,2) default 0,
  status text default 'pending' check (status in ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  payment_method text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.invoices enable row level security;
create policy "invoices_select" on public.invoices for select using (true);
create policy "invoices_insert" on public.invoices for insert with check (true);
create policy "invoices_update" on public.invoices for update using (true);

-- Vitals table
create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  recorded_by uuid references public.doctors(id) on delete set null,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature decimal(4,1),
  respiratory_rate integer,
  oxygen_saturation integer,
  weight decimal(5,2),
  height decimal(5,2),
  blood_sugar decimal(5,1),
  notes text,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.vitals enable row level security;
create policy "vitals_select" on public.vitals for select using (true);
create policy "vitals_insert" on public.vitals for insert with check (true);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error', 'appointment', 'emergency', 'billing')),
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_insert" on public.notifications for insert with check (true);
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);

-- Services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  price decimal(10,2) default 0,
  duration_minutes integer default 30,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.services enable row level security;
create policy "services_select" on public.services for select using (true);
create policy "services_insert" on public.services for insert with check (true);
create policy "services_update" on public.services for update using (true);

-- Reviews table  
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;
create policy "reviews_select" on public.reviews for select using (true);
create policy "reviews_insert" on public.reviews for insert with check (true);

-- Create profile on user signup
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
