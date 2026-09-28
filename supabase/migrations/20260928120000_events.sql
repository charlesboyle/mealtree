-- Real analytics: page views (with where they came from), link clicks and dish
-- opens, replacing the placeholder `stats` column. No personal data: no IP,
-- no user agent, no visitor id; only the traffic source and referring host.
-- Touches only the mealtree schema.

create table mealtree.events (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references mealtree.restaurants (id) on delete cascade,
  kind text not null check (kind in ('view', 'link_click', 'dish_open')),
  -- dish_open: the dish; link_click: which button (call, maps, order, …).
  item_id text check (length(item_id) <= 80),
  link_kind text check (link_kind in ('call', 'maps', 'reserve', 'order', 'instagram', 'website', 'whatsapp')),
  -- utm_source from the link (qr, instagram, google, …), else null.
  source text check (source ~ '^[a-z0-9_.-]{1,40}$'),
  -- Hostname of the referring site, when it isn't mealtree itself.
  referrer text check (referrer ~ '^[a-z0-9.-]{1,80}$'),
  locale text check (locale in ('en', 'ar')),
  created_at timestamptz not null default now()
);

create index events_restaurant_time on mealtree.events (restaurant_id, created_at desc);

-- Written and read only through the functions below.
alter table mealtree.events enable row level security;
revoke all on mealtree.events from anon, authenticated;

create function mealtree.track_event(
  p_slug text,
  p_kind text,
  p_item_id text default null,
  p_link_kind text default null,
  p_source text default null,
  p_referrer text default null,
  p_locale text default null
) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_restaurant uuid;
  v_source text := lower(left(trim(p_source), 40));
  v_referrer text := lower(left(trim(p_referrer), 80));
begin
  select id into v_restaurant from mealtree.restaurants where slug = p_slug and published;
  if v_restaurant is null or p_kind not in ('view', 'link_click', 'dish_open') then
    return;
  end if;
  -- Flood guard: a real menu doesn't get hundreds of events a minute.
  if (select count(*) from mealtree.events
      where restaurant_id = v_restaurant and created_at > now() - interval '1 minute') >= 300 then
    return;
  end if;
  insert into mealtree.events (restaurant_id, kind, item_id, link_kind, source, referrer, locale)
  values (
    v_restaurant,
    p_kind,
    case when p_kind = 'dish_open' then left(p_item_id, 80) end,
    case when p_kind = 'link_click'
      and p_link_kind in ('call', 'maps', 'reserve', 'order', 'instagram', 'website', 'whatsapp') then p_link_kind end,
    case when v_source ~ '^[a-z0-9_.-]{1,40}$' then v_source end,
    case when v_referrer ~ '^[a-z0-9.-]{1,80}$' then v_referrer end,
    case when p_locale in ('en', 'ar') then p_locale end
  );
end;
$$;

-- Last 30 days in the restaurant's own time zone, as the dashboard shows it.
create function mealtree.stats_json(p_restaurant uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with r as (
    select id, (now() at time zone timezone)::date as today, timezone
    from mealtree.restaurants where id = p_restaurant
  ),
  ev as (
    select e.kind, e.item_id, e.source, e.referrer, (e.created_at at time zone r.timezone)::date as day, r.today
    from mealtree.events e join r on e.restaurant_id = r.id
    where e.created_at > now() - interval '31 days'
      and (e.created_at at time zone r.timezone)::date > r.today - 30
  ),
  daily as (
    select d::date as day, (select count(*) from ev where ev.kind = 'view' and ev.day = d::date) as n
    from r, generate_series(r.today - 29, r.today, interval '1 day') d
  )
  select jsonb_build_object(
    'daily', (select jsonb_agg(n order by day) from daily),
    'views30d', (select count(*) from ev where kind = 'view'),
    'qrScans30d', (select count(*) from ev where kind = 'view' and source = 'qr'),
    'linkClicks30d', (select count(*) from ev where kind = 'link_click'),
    -- Last 14 days vs the 14 before; null until there's a previous period to compare.
    'trendPct', (
      select case when prev = 0 then null else round((cur - prev) * 100.0 / prev) end
      from (
        select count(*) filter (where day > today - 14) as cur,
               count(*) filter (where day <= today - 14 and day > today - 28) as prev
        from ev where kind = 'view'
      ) x
    ),
    'topDishes', (
      select coalesce(jsonb_agg(jsonb_build_object('itemId', item_id, 'views', n) order by n desc), '[]')
      from (select item_id, count(*) as n from ev where kind = 'dish_open' and item_id is not null
            group by item_id order by n desc limit 5) t
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('source', s, 'views', n) order by n desc), '[]')
      from (select coalesce(source, referrer, 'direct') as s, count(*) as n from ev where kind = 'view'
            group by 1 order by n desc limit 6) t
    )
  )
  from r;
$$;

revoke all on function mealtree.stats_json(uuid) from public, anon, authenticated;

-- Public aggregate counts for a published page (the claim pitch shows them before anyone signs in).
create function mealtree.restaurant_stats(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select mealtree.stats_json(id) from mealtree.restaurants where slug = p_slug and published;
$$;

revoke all on function mealtree.track_event(text, text, text, text, text, text, text), mealtree.restaurant_stats(text) from public;
grant execute on function mealtree.track_event(text, text, text, text, text, text, text), mealtree.restaurant_stats(text)
  to anon, authenticated;

-- The admin pipeline shows real stats too.
create or replace function mealtree.admin_overview(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  return jsonb_build_object(
    'restaurants', coalesce((
      select jsonb_agg(to_jsonb(r) - 'menus' || jsonb_build_object(
        'item_count', jsonb_array_length(jsonb_path_query_array(r.menus, '$[*].sections[*].items[*]')),
        'stats', mealtree.stats_json(r.id)
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

-- Placeholder numbers are gone; everything above is computed from events.
alter table mealtree.restaurants drop column stats;
