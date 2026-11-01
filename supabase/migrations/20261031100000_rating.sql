-- Rating shown on cards and restaurant pages: the score and how many ratings it is based on.
-- Loaded in bulk with scripts/import-ratings.mjs; unrated restaurants simply have nulls.
-- Like the other mealtree migrations, apply it manually.

alter table mealtree.restaurants
  add column if not exists rating numeric(2, 1) check (rating between 1 and 5),
  add column if not exists rating_count integer check (rating_count >= 0);

-- Sets ratings for many restaurants at once: [{"slug": "...", "rating": 4.3, "count": 120}, …]
create or replace function mealtree.admin_set_ratings(p_token text, p_data jsonb) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_count integer;
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.restaurants r
  set rating = x.rating, rating_count = x.count
  from jsonb_to_recordset(p_data) as x(slug text, rating numeric, count integer)
  where r.slug = x.slug;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function mealtree.admin_set_ratings(text, jsonb) from public;
grant execute on function mealtree.admin_set_ratings(text, jsonb) to anon, authenticated;
