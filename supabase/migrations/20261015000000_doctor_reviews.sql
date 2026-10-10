-- Verified doctor reviews: only patients with a completed visit can review,
-- and reviews are published after moderation.

create table public.doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  patient_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index doctor_reviews_doctor_idx on public.doctor_reviews (doctor_id, status, created_at desc);

alter table public.doctor_reviews enable row level security;

create policy "Approved reviews are public"
on public.doctor_reviews for select
to anon, authenticated
using (status = 'approved');

create policy "Patients read their own reviews"
on public.doctor_reviews for select
to authenticated
using (patient_id = auth.uid());

create policy "Admins manage reviews"
on public.doctor_reviews for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.submit_review(p_appointment_id uuid, p_rating integer, p_comment text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_name text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'INVALID_RATING' using errcode = 'P0001';
  end if;

  select * into v_appointment from public.appointments a
  where a.id = p_appointment_id and a.patient_id = auth.uid() and a.status = 'completed';
  if not found then
    raise exception 'NOT_ELIGIBLE' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.doctor_reviews r where r.appointment_id = p_appointment_id) then
    raise exception 'ALREADY_REVIEWED' using errcode = 'P0001';
  end if;

  -- Publish only a first name and last initial, e.g. "Maria G."
  select split_part(p.full_name, ' ', 1)
    || coalesce(' ' || left(nullif(split_part(p.full_name, ' ', 2), ''), 1) || '.', '')
  into v_name
  from public.patients p where p.user_id = auth.uid();

  insert into public.doctor_reviews (appointment_id, doctor_id, patient_id, author_name, rating, comment)
  values (p_appointment_id, v_appointment.doctor_id, auth.uid(), coalesce(v_name, 'Patient'), p_rating,
    nullif(trim(left(p_comment, 1000)), ''))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.get_doctor_ratings()
returns table (doctor_id uuid, average numeric, total integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.doctor_id, round(avg(r.rating)::numeric, 1), count(*)::integer
  from public.doctor_reviews r
  where r.status = 'approved'
  group by r.doctor_id
$$;

revoke all on function public.submit_review(uuid, integer, text) from public;
revoke all on function public.get_doctor_ratings() from public;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
grant execute on function public.get_doctor_ratings() to anon, authenticated;
