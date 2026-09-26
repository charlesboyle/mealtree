-- Admin tooling, claim review, takedowns. mealtree schema only.
--
--   * Claims start `pending`; an admin approves after calling the restaurant.
--     Only approved owners can edit.
--   * Restaurants can be unpublished (takedown requests, drafts).
--   * Anyone can file a removal request; only admins can read them.
--   * Admin RPCs are authorized by a secret token held server-side
--     (MEALTREE_ADMIN_TOKEN). Only its SHA-256 hash lives here; the row is
--     inserted out of band, never committed.

-- ——— Claim review ———————————————————————————————————————————————————————

alter table mealtree.owners
  add column status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  add column reviewed_at timestamptz;
alter table mealtree.owners alter column status set default 'pending';

-- A rejected claim shouldn't block a later, legitimate one.
alter table mealtree.owners drop constraint owners_restaurant_id_key;
create unique index owners_one_active_per_restaurant
  on mealtree.owners (restaurant_id) where status <> 'rejected';

-- ——— Publishing ————————————————————————————————————————————————————————————

alter table mealtree.restaurants add column published boolean not null default true;

drop policy "Menus are public" on mealtree.restaurants;
create policy "Published menus are public" on mealtree.restaurants
  for select to anon, authenticated using (published);

-- ——— Removal requests —————————————————————————————————————————————————————

create table mealtree.removal_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references mealtree.restaurants (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 120),
  contact text not null check (length(trim(contact)) between 3 and 200),
  reason text not null default '' check (length(reason) <= 2000),
  status text not null default 'open' check (status in ('open', 'removed', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table mealtree.removal_requests enable row level security;

-- ——— Admin keys ———————————————————————————————————————————————————————————

create table mealtree.admin_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  token_hash bytea not null unique,
  created_at timestamptz not null default now()
);
alter table mealtree.admin_keys enable row level security;

grant all on mealtree.removal_requests, mealtree.admin_keys to service_role;

create function mealtree.assert_admin(p_token text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from mealtree.admin_keys
    where token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'))
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
end;
$$;
revoke all on function mealtree.assert_admin(text) from public, anon, authenticated;

-- ——— Owner functions (updated) ————————————————————————————————————————————

create or replace function mealtree.authorize_owner(p_token text, p_slug text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_restaurant uuid;
begin
  select o.restaurant_id into v_restaurant
  from mealtree.owners o
  join mealtree.restaurants r on r.id = o.restaurant_id
  where r.slug = p_slug
    and o.status = 'approved'
    and o.token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if v_restaurant is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return v_restaurant;
end;
$$;

create or replace function mealtree.claim_restaurant(
  p_slug text, p_name text, p_role text, p_method text, p_google_opt_in boolean
) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid;
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  select id into v_restaurant from mealtree.restaurants where slug = p_slug and published for update;
  if v_restaurant is null then
    raise exception 'restaurant_not_found' using errcode = 'P0002';
  end if;
  if exists (select 1 from mealtree.restaurants where id = v_restaurant and claimed_at is not null)
     or exists (select 1 from mealtree.owners where restaurant_id = v_restaurant and status = 'approved') then
    raise exception 'already_claimed' using errcode = '23505';
  end if;
  if exists (select 1 from mealtree.owners where restaurant_id = v_restaurant and status = 'pending') then
    raise exception 'claim_pending' using errcode = '23505';
  end if;

  insert into mealtree.owners (restaurant_id, name, role, verification_method, google_opt_in, token_hash, status)
  values (v_restaurant, trim(p_name), p_role, p_method, coalesce(p_google_opt_in, false),
          sha256(convert_to(v_token, 'UTF8')), 'pending');
  return v_token;
end;
$$;

-- Return type gains `status`, so the function is recreated.
drop function mealtree.owner_session(text, text);
create function mealtree.owner_session(p_token text, p_slug text)
returns table (name text, role text, status text, google_opt_in boolean, google_requested_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  return query
    select o.name, o.role, o.status, o.google_opt_in, o.google_requested_at
    from mealtree.owners o
    join mealtree.restaurants r on r.id = o.restaurant_id
    where r.slug = p_slug
      and o.status <> 'rejected'
      and o.token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'));
  if not found then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
end;
$$;
revoke all on function mealtree.owner_session(text, text) from public;
grant execute on function mealtree.owner_session(text, text) to anon, authenticated;

-- ——— Public: removal requests —————————————————————————————————————————————

create function mealtree.request_removal(p_slug text, p_name text, p_contact text, p_reason text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  insert into mealtree.removal_requests (restaurant_id, name, contact, reason)
  values ((select id from mealtree.restaurants where slug = p_slug), trim(p_name), trim(p_contact), coalesce(p_reason, ''));
end;
$$;
revoke all on function mealtree.request_removal(text, text, text, text) from public;
grant execute on function mealtree.request_removal(text, text, text, text) to anon, authenticated;

-- ——— Admin RPCs ———————————————————————————————————————————————————————————

-- Everything the ops board needs in one round trip.
create function mealtree.admin_overview(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  return jsonb_build_object(
    'restaurants', coalesce((
      select jsonb_agg(to_jsonb(r) - 'menus' || jsonb_build_object(
        'item_count', jsonb_array_length(jsonb_path_query_array(r.menus, '$[*].sections[*].items[*]'))
      ) order by r.name)
      from mealtree.restaurants r), '[]'),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'slug', r.slug, 'restaurant', r.name, 'phone', r.phone,
        'name', o.name, 'role', o.role, 'method', o.verification_method,
        'google_opt_in', o.google_opt_in, 'google_requested_at', o.google_requested_at,
        'status', o.status, 'created_at', o.created_at, 'reviewed_at', o.reviewed_at
      ) order by o.created_at desc)
      from mealtree.owners o join mealtree.restaurants r on r.id = o.restaurant_id), '[]'),
    'removals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'slug', r.slug, 'restaurant', r.name, 'name', q.name, 'contact', q.contact,
        'reason', q.reason, 'status', q.status, 'created_at', q.created_at
      ) order by q.created_at desc)
      from mealtree.removal_requests q left join mealtree.restaurants r on r.id = q.restaurant_id), '[]')
  );
end;
$$;

create function mealtree.admin_get_restaurant(p_token text, p_slug text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  return (select to_jsonb(r) from mealtree.restaurants r where r.slug = p_slug);
end;
$$;

-- Insert or update by slug. Claim state and stats are never overwritten here.
create function mealtree.admin_upsert_restaurant(p_token text, p_data jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_slug text;
begin
  perform mealtree.assert_admin(p_token);
  insert into mealtree.restaurants (
    slug, name, tagline, cuisine, price_level, neighborhood, address, phone, timezone, accent, cover,
    hours, links, source, verified_at, google_menu_link, menus, published
  )
  select x.slug, x.name, coalesce(x.tagline, ''), coalesce(x.cuisine, '{}'), coalesce(x.price_level, 2),
    x.neighborhood, x.address, x.phone, coalesce(x.timezone, 'America/Los_Angeles'), coalesce(x.accent, '#1e6b47'),
    nullif(x.cover, ''), x.hours, coalesce(x.links, '[]'), x.source, x.verified_at,
    coalesce(x.google_menu_link, false), x.menus, coalesce(x.published, true)
  from jsonb_to_record(p_data) as x(
    slug text, name text, tagline text, cuisine text[], price_level smallint, neighborhood text, address text,
    phone text, timezone text, accent text, cover text, hours jsonb, links jsonb, source text, verified_at date,
    google_menu_link boolean, menus jsonb, published boolean
  )
  on conflict (slug) do update set
    name = excluded.name, tagline = excluded.tagline, cuisine = excluded.cuisine,
    price_level = excluded.price_level, neighborhood = excluded.neighborhood, address = excluded.address,
    phone = excluded.phone, timezone = excluded.timezone, accent = excluded.accent, cover = excluded.cover,
    hours = excluded.hours, links = excluded.links, source = excluded.source, verified_at = excluded.verified_at,
    google_menu_link = excluded.google_menu_link, menus = excluded.menus, published = excluded.published
  returning slug into v_slug;
  return v_slug;
end;
$$;

create function mealtree.admin_review_claim(p_token text, p_owner_id uuid, p_approve boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid;
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.owners
  set status = case when p_approve then 'approved' else 'rejected' end, reviewed_at = now()
  where id = p_owner_id and status = 'pending'
  returning restaurant_id into v_restaurant;
  if v_restaurant is null then
    raise exception 'claim_not_pending' using errcode = 'P0002';
  end if;
  if p_approve then
    update mealtree.restaurants set claimed_at = now() where id = v_restaurant;
  end if;
end;
$$;

create function mealtree.admin_resolve_removal(p_token text, p_id uuid, p_remove boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid;
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.removal_requests
  set status = case when p_remove then 'removed' else 'dismissed' end, resolved_at = now()
  where id = p_id
  returning restaurant_id into v_restaurant;
  if p_remove and v_restaurant is not null then
    update mealtree.restaurants set published = false where id = v_restaurant;
  end if;
end;
$$;

create function mealtree.admin_set_published(p_token text, p_slug text, p_published boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.restaurants set published = p_published where slug = p_slug;
end;
$$;

revoke all on function
  mealtree.admin_overview(text),
  mealtree.admin_get_restaurant(text, text),
  mealtree.admin_upsert_restaurant(text, jsonb),
  mealtree.admin_review_claim(text, uuid, boolean),
  mealtree.admin_resolve_removal(text, uuid, boolean),
  mealtree.admin_set_published(text, text, boolean)
from public;

-- Callable with the publishable key; each one checks the admin token first.
grant execute on function
  mealtree.admin_overview(text),
  mealtree.admin_get_restaurant(text, text),
  mealtree.admin_upsert_restaurant(text, jsonb),
  mealtree.admin_review_claim(text, uuid, boolean),
  mealtree.admin_resolve_removal(text, uuid, boolean),
  mealtree.admin_set_published(text, text, boolean)
to anon, authenticated;
