-- Map pin for each restaurant (WGS84). Used by the map browsing mode; restaurants without a pin
-- simply have nulls and stay off the map. admin_upsert_restaurant lists its columns explicitly,
-- so saving a restaurant in /ops leaves these untouched.
-- Like the other mealtree migrations, apply it manually.

alter table mealtree.restaurants
  add column if not exists lat double precision check (lat between -90 and 90),
  add column if not exists lng double precision check (lng between -180 and 180),
  add constraint restaurants_lat_lng_together check ((lat is null) = (lng is null));

-- Sets pins for many restaurants at once: [{"slug": "...", "lat": 24.49, "lng": 54.36}, …]
create or replace function mealtree.admin_set_locations(p_token text, p_data jsonb) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_count integer;
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.restaurants r
  set lat = x.lat, lng = x.lng
  from jsonb_to_recordset(p_data) as x(slug text, lat double precision, lng double precision)
  where r.slug = x.slug;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function mealtree.admin_set_locations(text, jsonb) from public;
grant execute on function mealtree.admin_set_locations(text, jsonb) to anon, authenticated;
