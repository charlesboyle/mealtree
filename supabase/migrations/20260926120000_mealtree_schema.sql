-- mealtree schema. Lives in its own `mealtree` schema so it can share a
-- Supabase project with other apps without touching their `public` tables.
--
-- Access model (no Supabase Auth users are created):
--   * anon/authenticated can SELECT restaurants and item_overrides (public menus).
--   * All writes go through SECURITY DEFINER functions below. Claiming a
--     restaurant returns a random owner token; only its SHA-256 hash is stored.
--     Later edits must present the token.
--   * owners is never readable through the API.

create schema if not exists mealtree;

-- ——— Tables ————————————————————————————————————————————————————————————

create table mealtree.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  tagline text not null default '',
  cuisine text[] not null default '{}',
  price_level smallint not null default 2 check (price_level between 1 and 4),
  neighborhood text not null,
  address text not null,
  phone text not null,
  timezone text not null default 'America/Los_Angeles',
  accent text not null default '#1e6b47' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  cover text,
  hours jsonb not null,
  links jsonb not null default '[]',
  source text not null check (source in ('visit', 'photos', 'website', 'owner')),
  verified_at date not null,
  google_menu_link boolean not null default false,
  menus jsonb not null,
  -- Placeholder analytics until real view tracking exists.
  stats jsonb not null default '{}',
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mealtree.owners (
  id uuid primary key default gen_random_uuid(),
  -- One verified owner per restaurant for the MVP.
  restaurant_id uuid not null unique references mealtree.restaurants (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  role text not null check (role in ('Owner', 'Manager', 'Staff')),
  verification_method text not null check (verification_method in ('phone', 'email', 'google')),
  google_opt_in boolean not null default false,
  google_requested_at timestamptz,
  token_hash bytea not null unique,
  created_at timestamptz not null default now()
);

create table mealtree.item_overrides (
  restaurant_id uuid not null references mealtree.restaurants (id) on delete cascade,
  item_id text not null,
  sold_out boolean,
  price numeric(8, 2) check (price > 0),
  updated_at timestamptz not null default now(),
  primary key (restaurant_id, item_id)
);

-- ——— Row level security —————————————————————————————————————————————————

alter table mealtree.restaurants enable row level security;
alter table mealtree.owners enable row level security;
alter table mealtree.item_overrides enable row level security;

create policy "Menus are public" on mealtree.restaurants
  for select to anon, authenticated using (true);

create policy "Owner edits are public" on mealtree.item_overrides
  for select to anon, authenticated using (true);

-- owners: RLS on, no policies, no grants → unreachable from the API.

grant usage on schema mealtree to anon, authenticated, service_role;
grant select on mealtree.restaurants, mealtree.item_overrides to anon, authenticated;
grant all on all tables in schema mealtree to service_role;

-- ——— Helpers ——————————————————————————————————————————————————————————————

create function mealtree.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger restaurants_touch before update on mealtree.restaurants
  for each row execute function mealtree.touch_updated_at();

-- Resolve an owner token to its restaurant; raises if it doesn't match.
create function mealtree.authorize_owner(p_token text, p_slug text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_restaurant uuid;
begin
  select o.restaurant_id into v_restaurant
  from mealtree.owners o
  join mealtree.restaurants r on r.id = o.restaurant_id
  where r.slug = p_slug and o.token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if v_restaurant is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return v_restaurant;
end;
$$;

revoke all on function mealtree.authorize_owner(text, text) from public, anon, authenticated;

-- ——— API functions ————————————————————————————————————————————————————————

-- Claim an unclaimed restaurant. Returns the owner token (shown once).
-- NOTE: verification is still a demo in the app; add a real OTP check here
-- before launch so the first caller can't claim someone else's restaurant.
create function mealtree.claim_restaurant(
  p_slug text,
  p_name text,
  p_role text,
  p_method text,
  p_google_opt_in boolean
) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  select id into v_restaurant from mealtree.restaurants where slug = p_slug for update;
  if v_restaurant is null then
    raise exception 'restaurant_not_found' using errcode = 'P0002';
  end if;
  if exists (select 1 from mealtree.restaurants where id = v_restaurant and claimed_at is not null)
     or exists (select 1 from mealtree.owners where restaurant_id = v_restaurant) then
    raise exception 'already_claimed' using errcode = '23505';
  end if;

  insert into mealtree.owners (restaurant_id, name, role, verification_method, google_opt_in, token_hash)
  values (v_restaurant, trim(p_name), p_role, p_method, coalesce(p_google_opt_in, false),
          sha256(convert_to(v_token, 'UTF8')));

  update mealtree.restaurants set claimed_at = now() where id = v_restaurant;
  return v_token;
end;
$$;

-- Owner's own session details (name is never exposed publicly).
create function mealtree.owner_session(p_token text, p_slug text)
returns table (name text, role text, google_opt_in boolean, google_requested_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_restaurant uuid := mealtree.authorize_owner(p_token, p_slug);
begin
  return query
    select o.name, o.role, o.google_opt_in, o.google_requested_at
    from mealtree.owners o where o.restaurant_id = v_restaurant;
end;
$$;

-- Set or clear an item's sold-out flag and/or price. Passing null for both
-- removes the override. p_clear_price resets the price to the menu's original.
create function mealtree.set_item_override(
  p_token text,
  p_slug text,
  p_item_id text,
  p_sold_out boolean default null,
  p_price numeric default null,
  p_clear_price boolean default false
) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid := mealtree.authorize_owner(p_token, p_slug);
begin
  if not exists (
    select 1 from mealtree.restaurants r
    where r.id = v_restaurant
      and jsonb_path_exists(r.menus, '$[*].sections[*].items[*] ? (@.id == $id)', jsonb_build_object('id', p_item_id))
  ) then
    raise exception 'item_not_found' using errcode = 'P0002';
  end if;

  insert into mealtree.item_overrides as io (restaurant_id, item_id, sold_out, price)
  values (v_restaurant, p_item_id, p_sold_out, case when p_clear_price then null else p_price end)
  on conflict (restaurant_id, item_id) do update set
    sold_out = coalesce(excluded.sold_out, io.sold_out),
    price = case when p_clear_price then null else coalesce(excluded.price, io.price) end,
    updated_at = now();

  delete from mealtree.item_overrides
  where restaurant_id = v_restaurant and item_id = p_item_id and sold_out is null and price is null;
end;
$$;

create function mealtree.reset_overrides(p_token text, p_slug text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from mealtree.item_overrides where restaurant_id = mealtree.authorize_owner(p_token, p_slug);
end;
$$;

create function mealtree.request_google_link(p_token text, p_slug text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  update mealtree.owners
  set google_opt_in = true, google_requested_at = coalesce(google_requested_at, now())
  where restaurant_id = mealtree.authorize_owner(p_token, p_slug);
end;
$$;

revoke all on function
  mealtree.claim_restaurant(text, text, text, text, boolean),
  mealtree.owner_session(text, text),
  mealtree.set_item_override(text, text, text, boolean, numeric, boolean),
  mealtree.reset_overrides(text, text),
  mealtree.request_google_link(text, text),
  mealtree.touch_updated_at()
from public;

grant execute on function
  mealtree.claim_restaurant(text, text, text, text, boolean),
  mealtree.owner_session(text, text),
  mealtree.set_item_override(text, text, text, boolean, numeric, boolean),
  mealtree.reset_overrides(text, text),
  mealtree.request_google_link(text, text)
to anon, authenticated;
