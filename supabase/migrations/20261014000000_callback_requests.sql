-- Urgent callback requests from the emergency page.

create table public.callback_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 25),
  concern text not null check (char_length(concern) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index callback_requests_status_idx on public.callback_requests (status, created_at desc);

alter table public.callback_requests enable row level security;

create policy "Admins manage callback requests"
on public.callback_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.request_callback(p_name text, p_phone text, p_concern text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 or char_length(v_digits) not between 10 and 15
    or char_length(trim(coalesce(p_concern, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  -- One open request per phone number is enough.
  select id into v_id from public.callback_requests
  where status = 'open' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return v_id;
  end if;

  insert into public.callback_requests (full_name, phone, concern)
  values (trim(p_name), trim(p_phone), trim(left(p_concern, 500)))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.request_callback(text, text, text) from public;
grant execute on function public.request_callback(text, text, text) to anon, authenticated;
