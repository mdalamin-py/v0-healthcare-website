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
