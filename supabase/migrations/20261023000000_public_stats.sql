-- Live figures for the public site and reviews with the doctor they are about.

create or replace view public.published_reviews as
  select r.id, r.doctor_id, r.author_name, r.rating, r.comment, r.created_at,
         d.full_name as doctor_name, d.specialty as doctor_specialty
  from public.doctor_reviews r
  join public.doctors d on d.id = r.doctor_id
  where r.status = 'approved';

create or replace function public.get_public_stats()
returns table (
  doctors integer,
  specialties integer,
  rating numeric,
  reviews integer,
  completed_visits integer,
  ambulances_ready integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from doctors where is_active and kind = 'consultant'),
    (select count(distinct specialty)::integer from doctors where is_active and kind = 'consultant'),
    (select round(avg(rating)::numeric, 1) from doctor_reviews where status = 'approved'),
    (select count(*)::integer from doctor_reviews where status = 'approved'),
    (select count(*)::integer from appointments where status = 'completed'),
    (select count(*)::integer from ambulances where status = 'available');
$$;

revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;
