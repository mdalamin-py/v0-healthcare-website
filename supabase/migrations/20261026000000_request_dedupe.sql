-- Callback and ambulance requests report whether a new row was created, so a
-- repeat submission from the same phone does not alert staff twice. A per-phone
-- advisory lock stops two simultaneous submissions from both inserting.

drop function if exists public.request_callback(text, text, text);
drop function if exists public.request_ambulance(text, text, text, text);

create function public.request_callback(p_name text, p_phone text, p_concern text)
returns jsonb
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

  perform pg_advisory_xact_lock(hashtext('callback:' || v_digits));

  -- One open request per phone number is enough.
  select id into v_id from public.callback_requests
  where status = 'open' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return jsonb_build_object('id', v_id, 'created', false);
  end if;

  insert into public.callback_requests (full_name, phone, concern)
  values (trim(p_name), trim(p_phone), trim(left(p_concern, 500)))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'created', true);
end;
$$;

create function public.request_ambulance(p_name text, p_phone text, p_address text, p_details text default null)
returns jsonb
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
    or char_length(trim(coalesce(p_address, ''))) < 5
  then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('ambulance:' || v_digits));

  -- A pending request from the same phone is already in the dispatch queue.
  select id into v_id from public.ambulance_requests
  where status = 'pending' and regexp_replace(phone, '\D', '', 'g') = v_digits
  limit 1;
  if v_id is not null then
    return jsonb_build_object('id', v_id, 'created', false);
  end if;

  insert into public.ambulance_requests (full_name, phone, pickup_address, details)
  values (trim(p_name), trim(p_phone), trim(p_address), nullif(trim(left(p_details, 500)), ''))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'created', true);
end;
$$;

revoke all on function public.request_callback(text, text, text) from public;
revoke all on function public.request_ambulance(text, text, text, text) from public;
grant execute on function public.request_callback(text, text, text) to anon, authenticated;
grant execute on function public.request_ambulance(text, text, text, text) to anon, authenticated;
