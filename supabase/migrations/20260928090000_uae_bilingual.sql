-- mealtree launches in the UAE: Arabic names for restaurants, a currency per
-- menu (AED), and Dubai as the default time zone. Menu-level Arabic fields
-- (nameAr, descriptionAr, …) live inside the `menus` JSON and need no schema change.
-- Touches only the mealtree schema.

alter table mealtree.restaurants
  add column name_ar text,
  add column tagline_ar text,
  add column neighborhood_ar text,
  add column address_ar text,
  add column currency text not null default 'AED' check (currency ~ '^[A-Z]{3}$');

alter table mealtree.restaurants alter column timezone set default 'Asia/Dubai';

create or replace function mealtree.admin_upsert_restaurant(p_token text, p_data jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_slug text;
begin
  perform mealtree.assert_admin(p_token);
  insert into mealtree.restaurants (
    slug, name, name_ar, tagline, tagline_ar, cuisine, price_level, neighborhood, neighborhood_ar,
    address, address_ar, phone, timezone, currency, accent, cover, hours, links, source, verified_at,
    google_menu_link, menus, published
  )
  select x.slug, x.name, nullif(trim(x.name_ar), ''), coalesce(x.tagline, ''), nullif(trim(x.tagline_ar), ''),
    coalesce(x.cuisine, '{}'), coalesce(x.price_level, 2), x.neighborhood, nullif(trim(x.neighborhood_ar), ''),
    x.address, nullif(trim(x.address_ar), ''), x.phone, coalesce(x.timezone, 'Asia/Dubai'),
    coalesce(x.currency, 'AED'), coalesce(x.accent, '#13734b'), nullif(x.cover, ''), x.hours,
    coalesce(x.links, '[]'), x.source, x.verified_at, coalesce(x.google_menu_link, false), x.menus,
    coalesce(x.published, true)
  from jsonb_to_record(p_data) as x(
    slug text, name text, name_ar text, tagline text, tagline_ar text, cuisine text[], price_level smallint,
    neighborhood text, neighborhood_ar text, address text, address_ar text, phone text, timezone text,
    currency text, accent text, cover text, hours jsonb, links jsonb, source text, verified_at date,
    google_menu_link boolean, menus jsonb, published boolean
  )
  on conflict (slug) do update set
    name = excluded.name, name_ar = excluded.name_ar, tagline = excluded.tagline, tagline_ar = excluded.tagline_ar,
    cuisine = excluded.cuisine, price_level = excluded.price_level, neighborhood = excluded.neighborhood,
    neighborhood_ar = excluded.neighborhood_ar, address = excluded.address, address_ar = excluded.address_ar,
    phone = excluded.phone, timezone = excluded.timezone, currency = excluded.currency, accent = excluded.accent,
    cover = excluded.cover, hours = excluded.hours, links = excluded.links, source = excluded.source,
    verified_at = excluded.verified_at, google_menu_link = excluded.google_menu_link, menus = excluded.menus,
    published = excluded.published
  returning slug into v_slug;
  return v_slug;
end;
$$;

-- `create or replace` keeps the existing grants (anon/authenticated, token-checked inside).
