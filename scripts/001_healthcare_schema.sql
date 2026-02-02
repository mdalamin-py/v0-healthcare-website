-- Dignity Home Health Care - Healthcare Management System Schema
-- Simplified version without custom enum types

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- USER PROFILES
-- =====================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'patient' check (role in ('admin', 'doctor', 'nurse', 'staff', 'patient', 'caregiver')),
  date_of_birth date,
  gender text,
  address text,
  city text,
  state text default 'CA',
  zip_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- DOCTORS
-- =====================================================
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
  languages text[] default array['English'],
  consultation_fee decimal(10,2) default 150,
  available_days text[] default array['Monday','Tuesday','Wednesday','Thursday','Friday'],
  available_from time default '09:00',
  available_to time default '17:00',
  is_active boolean default true,
  rating decimal(2,1) default 5.0,
  total_reviews integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PATIENTS
-- =====================================================
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  patient_id text unique,
  full_name text not null,
  email text,
  phone text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  blood_group text,
  address text,
  city text,
  state text default 'CA',
  zip_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_policy_number text,
  insurance_expiry date,
  allergies text[],
  chronic_conditions text[],
  primary_doctor_id uuid references public.doctors(id) on delete set null,
  avatar_url text,
  status text default 'active' check (status in ('active', 'discharged', 'transferred')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- APPOINTMENTS
-- =====================================================
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  appointment_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  appointment_date date not null,
  start_time time not null,
  end_time time,
  appointment_type text default 'in_person' check (appointment_type in ('in_person', 'home_visit', 'video_call', 'phone_call', 'emergency')),
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason text,
  symptoms text[],
  notes text,
  diagnosis text,
  follow_up_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- PRESCRIPTIONS
-- =====================================================
create table if not exists public.prescriptions (
  id uuid primary key default uuid_generate_v4(),
  prescription_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  diagnosis text,
  notes text,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default uuid_generate_v4(),
  prescription_id uuid references public.prescriptions(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text,
  quantity integer default 1,
  instructions text,
  created_at timestamptz default now()
);

-- =====================================================
-- AMBULANCES & EMERGENCY
-- =====================================================
create table if not exists public.ambulances (
  id uuid primary key default uuid_generate_v4(),
  ambulance_id text unique,
  vehicle_number text not null unique,
  vehicle_type text default 'Basic Life Support' check (vehicle_type in ('Basic Life Support', 'Advanced Life Support', 'Mobile ICU', 'Neonatal')),
  driver_name text,
  driver_phone text,
  paramedic_name text,
  paramedic_phone text,
  current_lat decimal(10,8),
  current_lng decimal(11,8),
  status text default 'available' check (status in ('available', 'dispatched', 'en_route', 'on_scene', 'returning', 'maintenance')),
  equipment text[],
  last_service_date date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.emergency_requests (
  id uuid primary key default uuid_generate_v4(),
  request_id text unique,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  patient_phone text not null,
  patient_age integer,
  emergency_type text not null,
  severity text default 'moderate' check (severity in ('critical', 'severe', 'moderate', 'minor')),
  description text,
  pickup_address text not null,
  pickup_lat decimal(10,8),
  pickup_lng decimal(11,8),
  landmark text,
  destination text,
  ambulance_id uuid references public.ambulances(id) on delete set null,
  dispatcher_id uuid references auth.users(id) on delete set null,
  status text default 'pending' check (status in ('pending', 'dispatched', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled')),
  dispatched_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- BILLING & PAYMENTS
-- =====================================================
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_id text unique,
  patient_id uuid references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  subtotal decimal(10,2) not null,
  tax decimal(10,2) default 0,
  discount decimal(10,2) default 0,
  total decimal(10,2) not null,
  paid_amount decimal(10,2) default 0,
  status text default 'pending' check (status in ('draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),
  due_date date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer default 1,
  unit_price decimal(10,2) not null,
  total decimal(10,2) not null,
  service_type text,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  payment_id text unique,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'insurance', 'bank_transfer', 'check', 'online')),
  transaction_id text,
  status text default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded')),
  received_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- =====================================================
-- VITALS & MEDICAL RECORDS
-- =====================================================
create table if not exists public.vitals (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  recorded_by uuid references auth.users(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature decimal(4,1),
  respiratory_rate integer,
  oxygen_saturation integer,
  blood_sugar decimal(5,1),
  weight decimal(5,2),
  height decimal(5,2),
  pain_level integer check (pain_level >= 0 and pain_level <= 10),
  notes text,
  recorded_at timestamptz default now()
);

create table if not exists public.medical_history (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  condition text not null,
  diagnosis_date date,
  treatment text,
  treating_doctor text,
  hospital text,
  notes text,
  is_resolved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  document_type text not null,
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_size integer,
  created_at timestamptz default now()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error', 'appointment', 'emergency', 'payment', 'prescription')),
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

-- =====================================================
-- SERVICES & CARE PLANS
-- =====================================================
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  description text,
  duration_minutes integer default 60,
  price decimal(10,2),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.care_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  goals text[],
  status text default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================
-- REVIEWS
-- =====================================================
create table if not exists public.doctor_reviews (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
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
alter table public.medical_history enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.services enable row level security;
alter table public.care_plans enable row level security;
alter table public.doctor_reviews enable row level security;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles: users can see own, staff can see all
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Doctors: public read
create policy "doctors_select_all" on public.doctors for select using (true);
create policy "doctors_all_admin" on public.doctors for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Patients
create policy "patients_select" on public.patients for select using (
  user_id = auth.uid() or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);
create policy "patients_insert" on public.patients for insert with check (true);
create policy "patients_update" on public.patients for update using (
  user_id = auth.uid() or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);

-- Appointments
create policy "appointments_select" on public.appointments for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.doctors where id = doctor_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);
create policy "appointments_insert" on public.appointments for insert with check (true);
create policy "appointments_update" on public.appointments for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'staff'))
);

-- Prescriptions
create policy "prescriptions_select" on public.prescriptions for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'staff'))
);
create policy "prescriptions_insert" on public.prescriptions for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor'))
);
create policy "prescriptions_update" on public.prescriptions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor'))
);

-- Prescription items
create policy "prescription_items_select" on public.prescription_items for select using (true);
create policy "prescription_items_insert" on public.prescription_items for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor'))
);

-- Ambulances: public read for tracking
create policy "ambulances_select" on public.ambulances for select using (true);
create policy "ambulances_all_admin" on public.ambulances for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- Emergency requests
create policy "emergency_select" on public.emergency_requests for select using (
  patient_id is null or
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);
create policy "emergency_insert" on public.emergency_requests for insert with check (true);
create policy "emergency_update" on public.emergency_requests for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- Invoices
create policy "invoices_select" on public.invoices for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);
create policy "invoices_all_admin" on public.invoices for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- Invoice items
create policy "invoice_items_select" on public.invoice_items for select using (true);
create policy "invoice_items_all_admin" on public.invoice_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- Payments
create policy "payments_select" on public.payments for select using (true);
create policy "payments_all_admin" on public.payments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- Vitals
create policy "vitals_select" on public.vitals for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);
create policy "vitals_insert" on public.vitals for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse'))
);

-- Medical history
create policy "medical_history_select" on public.medical_history for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);
create policy "medical_history_insert" on public.medical_history for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse'))
);

-- Documents
create policy "documents_select" on public.documents for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);
create policy "documents_insert" on public.documents for insert with check (true);

-- Notifications
create policy "notifications_select" on public.notifications for select using (user_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert with check (true);
create policy "notifications_update" on public.notifications for update using (user_id = auth.uid());
create policy "notifications_delete" on public.notifications for delete using (user_id = auth.uid());

-- Services: public read
create policy "services_select" on public.services for select using (true);
create policy "services_all_admin" on public.services for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Care plans
create policy "care_plans_select" on public.care_plans for select using (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid()) or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor', 'nurse', 'staff'))
);
create policy "care_plans_all_admin" on public.care_plans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'doctor'))
);

-- Doctor reviews: public read
create policy "doctor_reviews_select" on public.doctor_reviews for select using (true);
create policy "doctor_reviews_insert" on public.doctor_reviews for insert with check (
  exists (select 1 from public.patients where id = patient_id and user_id = auth.uid())
);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

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

-- Update timestamp function
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ID generation functions
create or replace function generate_doctor_id()
returns trigger language plpgsql as $$
begin
  if new.doctor_id is null then
    new.doctor_id := 'DOC' || lpad(nextval('doctor_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_patient_id()
returns trigger language plpgsql as $$
begin
  if new.patient_id is null then
    new.patient_id := 'PAT' || lpad(nextval('patient_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_appointment_id()
returns trigger language plpgsql as $$
begin
  if new.appointment_id is null then
    new.appointment_id := 'APT' || lpad(nextval('appointment_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_prescription_id()
returns trigger language plpgsql as $$
begin
  if new.prescription_id is null then
    new.prescription_id := 'RX' || lpad(nextval('prescription_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_ambulance_id()
returns trigger language plpgsql as $$
begin
  if new.ambulance_id is null then
    new.ambulance_id := 'AMB' || lpad(nextval('ambulance_id_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_request_id()
returns trigger language plpgsql as $$
begin
  if new.request_id is null then
    new.request_id := 'EMR' || lpad(nextval('request_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_invoice_id()
returns trigger language plpgsql as $$
begin
  if new.invoice_id is null then
    new.invoice_id := 'INV' || lpad(nextval('invoice_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function generate_payment_id()
returns trigger language plpgsql as $$
begin
  if new.payment_id is null then
    new.payment_id := 'PAY' || lpad(nextval('payment_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

-- Create sequences
create sequence if not exists doctor_id_seq start 1;
create sequence if not exists patient_id_seq start 1;
create sequence if not exists appointment_id_seq start 1;
create sequence if not exists prescription_id_seq start 1;
create sequence if not exists ambulance_id_seq start 1;
create sequence if not exists request_id_seq start 1;
create sequence if not exists invoice_id_seq start 1;
create sequence if not exists payment_id_seq start 1;

-- Create ID triggers
drop trigger if exists generate_doctor_id_trigger on public.doctors;
create trigger generate_doctor_id_trigger before insert on public.doctors for each row execute function generate_doctor_id();

drop trigger if exists generate_patient_id_trigger on public.patients;
create trigger generate_patient_id_trigger before insert on public.patients for each row execute function generate_patient_id();

drop trigger if exists generate_appointment_id_trigger on public.appointments;
create trigger generate_appointment_id_trigger before insert on public.appointments for each row execute function generate_appointment_id();

drop trigger if exists generate_prescription_id_trigger on public.prescriptions;
create trigger generate_prescription_id_trigger before insert on public.prescriptions for each row execute function generate_prescription_id();

drop trigger if exists generate_ambulance_id_trigger on public.ambulances;
create trigger generate_ambulance_id_trigger before insert on public.ambulances for each row execute function generate_ambulance_id();

drop trigger if exists generate_request_id_trigger on public.emergency_requests;
create trigger generate_request_id_trigger before insert on public.emergency_requests for each row execute function generate_request_id();

drop trigger if exists generate_invoice_id_trigger on public.invoices;
create trigger generate_invoice_id_trigger before insert on public.invoices for each row execute function generate_invoice_id();

drop trigger if exists generate_payment_id_trigger on public.payments;
create trigger generate_payment_id_trigger before insert on public.payments for each row execute function generate_payment_id();

-- Update triggers
drop trigger if exists update_profiles_timestamp on public.profiles;
create trigger update_profiles_timestamp before update on public.profiles for each row execute function update_updated_at();

drop trigger if exists update_doctors_timestamp on public.doctors;
create trigger update_doctors_timestamp before update on public.doctors for each row execute function update_updated_at();

drop trigger if exists update_patients_timestamp on public.patients;
create trigger update_patients_timestamp before update on public.patients for each row execute function update_updated_at();

drop trigger if exists update_appointments_timestamp on public.appointments;
create trigger update_appointments_timestamp before update on public.appointments for each row execute function update_updated_at();

drop trigger if exists update_prescriptions_timestamp on public.prescriptions;
create trigger update_prescriptions_timestamp before update on public.prescriptions for each row execute function update_updated_at();

drop trigger if exists update_ambulances_timestamp on public.ambulances;
create trigger update_ambulances_timestamp before update on public.ambulances for each row execute function update_updated_at();

drop trigger if exists update_emergency_requests_timestamp on public.emergency_requests;
create trigger update_emergency_requests_timestamp before update on public.emergency_requests for each row execute function update_updated_at();

drop trigger if exists update_invoices_timestamp on public.invoices;
create trigger update_invoices_timestamp before update on public.invoices for each row execute function update_updated_at();

drop trigger if exists update_care_plans_timestamp on public.care_plans;
create trigger update_care_plans_timestamp before update on public.care_plans for each row execute function update_updated_at();

-- =====================================================
-- INDEXES
-- =====================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_doctors_specialty on public.doctors(specialty);
create index if not exists idx_doctors_active on public.doctors(is_active);
create index if not exists idx_patients_user on public.patients(user_id);
create index if not exists idx_patients_doctor on public.patients(primary_doctor_id);
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_appointments_doctor on public.appointments(doctor_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_prescriptions_patient on public.prescriptions(patient_id);
create index if not exists idx_emergency_status on public.emergency_requests(status);
create index if not exists idx_invoices_patient on public.invoices(patient_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_vitals_patient on public.vitals(patient_id);
