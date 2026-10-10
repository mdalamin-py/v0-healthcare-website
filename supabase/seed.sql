-- Sample data for local development and first launch.
-- Replace these doctors with your real team from the admin dashboard.

insert into public.doctors (slug, full_name, specialty, qualification, experience_years, bio, consultation_fee, languages, room)
values
  ('sarah-johnson', 'Dr. Sarah Johnson', 'Geriatric Medicine', 'MD, Board Certified in Geriatrics', 20,
   'Medical Director focused on comprehensive care for older adults, chronic disease management and care coordination.',
   150, array['English'], 'Room 101'),
  ('michael-patel', 'Dr. Michael Patel', 'Internal Medicine', 'MD, FACP', 15,
   'Internist experienced in diabetes, hypertension and preventive care for adults of all ages.',
   140, array['English', 'Hindi'], 'Room 102'),
  ('emily-nguyen', 'Dr. Emily Nguyen', 'Cardiology', 'MD, FACC', 12,
   'Cardiologist specializing in heart failure management and post-hospital cardiac follow-up.',
   180, array['English', 'Vietnamese'], 'Room 201'),
  ('daniel-ramirez', 'Dr. Daniel Ramirez', 'Family Medicine', 'MD, Board Certified in Family Medicine', 10,
   'Family physician providing whole-person care, from routine check-ups to chronic condition follow-up.',
   120, array['English', 'Spanish'], 'Room 103'),
  ('aisha-rahman', 'Dr. Aisha Rahman', 'Endocrinology', 'MD, Board Certified in Endocrinology', 9,
   'Endocrinologist helping patients manage diabetes, thyroid disorders and metabolic health.',
   170, array['English', 'Bengali'], 'Room 202'),
  ('james-chen', 'James Chen, DPT', 'Physical Therapy', 'Doctor of Physical Therapy', 11,
   'Lead physical therapist dedicated to helping patients regain mobility, balance and independence.',
   110, array['English', 'Mandarin'], 'Rehab Suite');

update public.doctors set visit_types = case slug
  when 'sarah-johnson' then array['in_clinic', 'video', 'home_visit']::public.visit_type[]
  when 'james-chen' then array['in_clinic', 'home_visit']::public.visit_type[]
  when 'emily-nguyen' then array['in_clinic']::public.visit_type[]
  else array['in_clinic', 'video']::public.visit_type[]
end;

insert into public.doctor_schedules (doctor_id, weekday, start_time, end_time, max_patients)
select d.id, s.weekday, s.start_time::time, s.end_time::time, s.max_patients
from (values
  ('sarah-johnson', 1, '09:00', '13:00', 16),
  ('sarah-johnson', 3, '09:00', '13:00', 16),
  ('sarah-johnson', 5, '14:00', '17:00', 12),
  ('michael-patel', 1, '14:00', '18:00', 20),
  ('michael-patel', 2, '09:00', '13:00', 20),
  ('michael-patel', 4, '09:00', '13:00', 20),
  ('emily-nguyen', 2, '14:00', '17:00', 10),
  ('emily-nguyen', 4, '14:00', '17:00', 10),
  ('daniel-ramirez', 1, '08:00', '12:00', 24),
  ('daniel-ramirez', 3, '13:00', '17:00', 24),
  ('daniel-ramirez', 6, '09:00', '12:00', 15),
  ('aisha-rahman', 2, '09:00', '12:00', 12),
  ('aisha-rahman', 5, '09:00', '12:00', 12),
  ('james-chen', 1, '10:00', '16:00', 12),
  ('james-chen', 3, '10:00', '16:00', 12),
  ('james-chen', 5, '10:00', '16:00', 12)
) as s (slug, weekday, start_time, end_time, max_patients)
join public.doctors d on d.slug = s.slug;

-- Rotating 12-hour on-call shifts for the next two weeks (Pacific time).
insert into public.on_call_shifts (doctor_id, starts_at, ends_at, note)
select
  d.id,
  (day + shift.start_offset) at time zone 'America/Los_Angeles',
  (day + shift.start_offset + interval '12 hours') at time zone 'America/Los_Angeles',
  shift.label
from generate_series(
  date_trunc('day', now() at time zone 'America/Los_Angeles'),
  date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '13 days',
  interval '1 day'
) as day
cross join (values (interval '8 hours', 'Day shift', 0), (interval '20 hours', 'Night shift', 1)) as shift (start_offset, label, idx)
join lateral (
  select id
  from public.doctors
  where slug = (array['sarah-johnson', 'michael-patel', 'daniel-ramirez', 'emily-nguyen'])[
    1 + ((extract(doy from day)::integer * 2 + shift.idx) % 4)
  ]
) as d on true;

-- Intern doctors and their ward / emergency duty (Pacific time).
insert into public.doctors (slug, full_name, specialty, qualification, kind, accepting_appointments, languages, bio)
values
  ('aiden-brooks', 'Dr. Aiden Brooks', 'Internal Medicine', 'MBBS, Intern', 'intern', false, array['English'],
   'Intern doctor rotating through internal medicine and the emergency department.'),
  ('fatima-noor', 'Dr. Fatima Noor', 'Family Medicine', 'MBBS, Intern', 'intern', false, array['English', 'Urdu'],
   'Intern doctor supporting family medicine clinics and ward rounds.'),
  ('lucas-mendes', 'Dr. Lucas Mendes', 'Geriatric Medicine', 'MD, Intern', 'intern', false, array['English', 'Portuguese'],
   'Intern doctor on the geriatric care team.');

insert into public.on_call_shifts (doctor_id, starts_at, ends_at, note, duty_type)
select
  d.id,
  (day + shift.start_offset) at time zone 'America/Los_Angeles',
  (day + shift.start_offset + shift.length) at time zone 'America/Los_Angeles',
  shift.label,
  shift.duty
from generate_series(
  date_trunc('day', now() at time zone 'America/Los_Angeles'),
  date_trunc('day', now() at time zone 'America/Los_Angeles') + interval '13 days',
  interval '1 day'
) as day
cross join (values
  (interval '8 hours', interval '8 hours', 'Morning ward', 'ward', 0),
  (interval '16 hours', interval '8 hours', 'Evening emergency', 'emergency', 1),
  (interval '0 hours', interval '8 hours', 'Night emergency', 'emergency', 2)
) as shift (start_offset, length, label, duty, idx)
join lateral (
  select id from public.doctors
  where slug = (array['aiden-brooks', 'fatima-noor', 'lucas-mendes'])[1 + ((extract(doy from day)::integer + shift.idx) % 3)]
) as d on true;

-- Sample doctor and compounder contacts for the daily serial email.
insert into public.doctor_contacts (doctor_id, email, assistant_name, assistant_email)
select id, slug || '@dignityhomehealthcare.com', 'Front desk', 'frontdesk@dignityhomehealthcare.com'
from public.doctors
where kind = 'consultant';

-- Sample ambulance fleet.
insert into public.ambulances (code, vehicle_model, registration, type, status, equipment, base_location, driver_name)
values
  ('AMB-01', 'Ford E-450 Type III', '8ABC123', 'als', 'available',
   array['Cardiac monitor', 'Defibrillator', 'Ventilator', 'Oxygen', 'IV supplies'], 'Fresno main station', 'Carlos Vega'),
  ('AMB-02', 'Mercedes-Benz Sprinter 3500', '8DEF456', 'bls', 'available',
   array['AED', 'Oxygen', 'Stretcher', 'First aid kit'], 'Fresno main station', 'Linda Park'),
  ('AMB-03', 'Ram ProMaster 3500', '8GHI789', 'transport', 'on_trip',
   array['Wheelchair lift', 'Stretcher', 'Oxygen'], 'Clovis satellite', 'Marcus Lee'),
  ('AMB-04', 'Ford F-550 Type I', '8JKL012', 'icu', 'available',
   array['Ventilator', 'Infusion pumps', 'Cardiac monitor', 'Defibrillator', 'Suction unit'], 'Fresno main station', 'Priya Nair'),
  ('AMB-05', 'Chevrolet G4500 Type III', '8MNO345', 'neonatal', 'maintenance',
   array['Transport incubator', 'Neonatal ventilator', 'Oxygen'], 'Fresno main station', null);
