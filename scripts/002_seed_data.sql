-- Dignity Home Health Care - Seed Data
-- This script populates the database with initial data

-- =====================================================
-- SPECIALIZATIONS
-- =====================================================
INSERT INTO public.specializations (name, description) VALUES
('Internal Medicine', 'General adult medicine and comprehensive care'),
('Geriatrics', 'Medical care for elderly patients'),
('Cardiology', 'Heart and cardiovascular system care'),
('Neurology', 'Brain, spine, and nervous system disorders'),
('Pulmonology', 'Respiratory and lung conditions'),
('Orthopedics', 'Bone, joint, and muscle conditions'),
('Physical Therapy', 'Movement and rehabilitation therapy'),
('Occupational Therapy', 'Daily living skills rehabilitation'),
('Speech Therapy', 'Communication and swallowing disorders'),
('Wound Care', 'Specialized wound treatment and healing'),
('Palliative Care', 'Comfort care for serious illness'),
('Mental Health', 'Psychiatric and psychological care'),
('Diabetes Care', 'Diabetes management and education'),
('Home Health Nursing', 'Skilled nursing services at home')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SERVICE CATEGORIES
-- =====================================================
INSERT INTO public.service_categories (name, description, icon) VALUES
('Skilled Nursing', 'Professional nursing care provided by registered nurses', 'Stethoscope'),
('Therapy Services', 'Physical, occupational, and speech therapy', 'Activity'),
('Personal Care', 'Assistance with daily living activities', 'Heart'),
('Medical Social Services', 'Counseling and resource coordination', 'Users'),
('Home Health Aide', 'Supportive care under nurse supervision', 'Home'),
('Specialized Care', 'Disease-specific and wound care management', 'Shield')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SERVICES
-- =====================================================
INSERT INTO public.services (category_id, name, description, duration_minutes, base_price) 
SELECT 
  sc.id,
  s.name,
  s.description,
  s.duration,
  s.price
FROM (VALUES
  ('Skilled Nursing', 'Medication Management', 'Administration and monitoring of medications', 30, 75.00),
  ('Skilled Nursing', 'Wound Care', 'Professional wound assessment and treatment', 45, 95.00),
  ('Skilled Nursing', 'IV Therapy', 'Intravenous medication administration', 60, 125.00),
  ('Skilled Nursing', 'Catheter Care', 'Urinary catheter management and care', 30, 65.00),
  ('Skilled Nursing', 'Vital Signs Monitoring', 'Regular health status monitoring', 20, 45.00),
  ('Skilled Nursing', 'Diabetic Care', 'Blood sugar monitoring and insulin management', 30, 55.00),
  ('Therapy Services', 'Physical Therapy', 'Movement and strength rehabilitation', 60, 150.00),
  ('Therapy Services', 'Occupational Therapy', 'Daily living skills training', 60, 145.00),
  ('Therapy Services', 'Speech Therapy', 'Communication and swallowing therapy', 60, 140.00),
  ('Personal Care', 'Bathing Assistance', 'Help with personal hygiene', 45, 40.00),
  ('Personal Care', 'Grooming & Dressing', 'Assistance with personal appearance', 30, 35.00),
  ('Personal Care', 'Meal Preparation', 'Nutritious meal planning and preparation', 60, 45.00),
  ('Personal Care', 'Mobility Assistance', 'Help with walking and transfers', 30, 40.00),
  ('Medical Social Services', 'Care Coordination', 'Organizing healthcare services', 60, 85.00),
  ('Medical Social Services', 'Family Counseling', 'Support for patients and families', 60, 95.00),
  ('Home Health Aide', 'Companionship', 'Social interaction and emotional support', 120, 50.00),
  ('Home Health Aide', 'Light Housekeeping', 'Basic household maintenance', 60, 35.00),
  ('Specialized Care', 'Post-Surgery Care', 'Recovery support after surgery', 60, 100.00),
  ('Specialized Care', 'Chronic Disease Management', 'Ongoing care for chronic conditions', 45, 85.00),
  ('Specialized Care', 'Palliative Care', 'Comfort and quality of life care', 60, 110.00)
) AS s(category_name, name, description, duration, price)
JOIN public.service_categories sc ON sc.name = s.category_name;

-- =====================================================
-- MEDICINES CATALOG
-- =====================================================
INSERT INTO public.medicines (name, generic_name, manufacturer, category, dosage_form, strength, price, requires_prescription) VALUES
('Lisinopril', 'Lisinopril', 'Generic', 'Cardiovascular', 'Tablet', '10mg', 15.99, true),
('Metformin', 'Metformin HCl', 'Generic', 'Diabetes', 'Tablet', '500mg', 12.99, true),
('Amlodipine', 'Amlodipine Besylate', 'Generic', 'Cardiovascular', 'Tablet', '5mg', 18.99, true),
('Omeprazole', 'Omeprazole', 'Generic', 'Gastrointestinal', 'Capsule', '20mg', 22.99, true),
('Levothyroxine', 'Levothyroxine Sodium', 'Generic', 'Thyroid', 'Tablet', '50mcg', 14.99, true),
('Atorvastatin', 'Atorvastatin Calcium', 'Lipitor', 'Cardiovascular', 'Tablet', '20mg', 45.99, true),
('Gabapentin', 'Gabapentin', 'Generic', 'Neurology', 'Capsule', '300mg', 28.99, true),
('Hydrocodone/APAP', 'Hydrocodone/Acetaminophen', 'Generic', 'Pain', 'Tablet', '5/325mg', 35.99, true),
('Sertraline', 'Sertraline HCl', 'Zoloft', 'Mental Health', 'Tablet', '50mg', 32.99, true),
('Furosemide', 'Furosemide', 'Lasix', 'Cardiovascular', 'Tablet', '40mg', 11.99, true),
('Metoprolol', 'Metoprolol Tartrate', 'Generic', 'Cardiovascular', 'Tablet', '25mg', 16.99, true),
('Losartan', 'Losartan Potassium', 'Generic', 'Cardiovascular', 'Tablet', '50mg', 19.99, true),
('Albuterol', 'Albuterol Sulfate', 'Generic', 'Respiratory', 'Inhaler', '90mcg', 45.99, true),
('Prednisone', 'Prednisone', 'Generic', 'Anti-inflammatory', 'Tablet', '10mg', 8.99, true),
('Acetaminophen', 'Acetaminophen', 'Tylenol', 'Pain', 'Tablet', '500mg', 7.99, false),
('Ibuprofen', 'Ibuprofen', 'Advil', 'Pain', 'Tablet', '200mg', 8.99, false),
('Aspirin', 'Aspirin', 'Bayer', 'Cardiovascular', 'Tablet', '81mg', 6.99, false),
('Vitamin D3', 'Cholecalciferol', 'Generic', 'Supplement', 'Capsule', '2000IU', 12.99, false),
('Calcium + D', 'Calcium Carbonate/D3', 'Generic', 'Supplement', 'Tablet', '600mg/400IU', 14.99, false),
('Multivitamin', 'Multivitamin', 'Centrum', 'Supplement', 'Tablet', 'Standard', 19.99, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- AMBULANCES
-- =====================================================
INSERT INTO public.ambulances (vehicle_number, vehicle_type, driver_name, driver_phone, paramedic_name, paramedic_phone, is_available, equipment) VALUES
('AMB-001', 'Advanced Life Support', 'Michael Rodriguez', '559-555-0101', 'Sarah Chen, EMT-P', '559-555-0102', true, ARRAY['Defibrillator', 'Cardiac Monitor', 'IV Equipment', 'Oxygen', 'Stretcher']),
('AMB-002', 'Basic Life Support', 'James Wilson', '559-555-0103', 'Emily Davis, EMT-B', '559-555-0104', true, ARRAY['First Aid Kit', 'Oxygen', 'Stretcher', 'Splints', 'Bandages']),
('AMB-003', 'Advanced Life Support', 'Robert Martinez', '559-555-0105', 'Jennifer Kim, EMT-P', '559-555-0106', true, ARRAY['Defibrillator', 'Cardiac Monitor', 'IV Equipment', 'Oxygen', 'Stretcher', 'Ventilator']),
('AMB-004', 'Mobile ICU', 'David Thompson', '559-555-0107', 'Dr. Amanda White', '559-555-0108', true, ARRAY['Full ICU Equipment', 'Ventilator', 'Defibrillator', 'Cardiac Monitor', 'IV Pumps', 'Emergency Medications']),
('AMB-005', 'Basic Life Support', 'Christopher Lee', '559-555-0109', 'Daniel Brown, EMT-B', '559-555-0110', false, ARRAY['First Aid Kit', 'Oxygen', 'Stretcher', 'Splints'])
ON CONFLICT (vehicle_number) DO NOTHING;
