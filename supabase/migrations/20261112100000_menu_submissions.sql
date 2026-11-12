-- "Get your digital menu for free": restaurant owners send their menu (photos or PDF) and we build their page.
--
--   * Files go straight from the browser to the PRIVATE Storage bucket `owner-menus`, under
--     submissions/<submission id>/<01..10>.<ext>, with the publishable key. Anon may only INSERT there:
--     no select, update or delete, so nobody can list, read or overwrite what others sent.
--   * The browser then calls `submit_menu` with the same id and the uploaded paths. It validates the
--     fields, checks every file really is in the bucket, and inserts one row into mealtree.menu_submissions.
--     The table has RLS on and no policies: only the SECURITY DEFINER functions below touch it.
--   * Ops lists submissions and sets their status through admin RPCs checked against the admin token
--     (like admin_overview). To open the files, the ops page signs URLs server-side with the token in the
--     `x-admin-token` header, which the admin-only SELECT policy on the bucket accepts (like the `menus` bucket).
--
-- Like the other mealtree migrations, apply it manually; it is not recorded in Ketticho's
-- supabase_migrations history.

-- ——— Table ————————————————————————————————————————————————————————————————

create table mealtree.menu_submissions (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  restaurant_name text not null check (length(restaurant_name) between 1 and 160),
  maps_url text not null check (length(maps_url) between 8 and 500),
  phone text not null check (length(phone) between 7 and 40),
  contact_name text check (contact_name is null or length(contact_name) between 1 and 120),
  file_paths text[] not null check (cardinality(file_paths) between 1 and 10),
  source text not null default 'unknown' check (source ~ '^[a-z_]{1,32}$'),
  locale text check (locale in ('en', 'ar')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'rejected')),
  note text not null default '' check (length(note) <= 2000)
);
create index menu_submissions_created_at on mealtree.menu_submissions (created_at desc);

alter table mealtree.menu_submissions enable row level security;
revoke all on mealtree.menu_submissions from public, anon, authenticated;
grant all on mealtree.menu_submissions to service_role;

-- ——— Storage bucket ———————————————————————————————————————————————————————

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'owner-menus', 'owner-menus', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
on conflict (id) do nothing;

-- A loose brake on anonymous uploads: at most 300 files in the bucket per 10 minutes, across everyone.
create or replace function mealtree.owner_menus_upload_allowed() returns boolean
language sql stable security definer set search_path = '' as $$
  select count(*) < 300 from storage.objects
  where bucket_id = 'owner-menus' and created_at > now() - interval '10 minutes';
$$;
revoke all on function mealtree.owner_menus_upload_allowed() from public;
grant execute on function mealtree.owner_menus_upload_allowed() to anon, authenticated;

-- Anyone may add a file, but only as submissions/<uuid>/<01..10>.<ext>: ten names per folder, and with no
-- UPDATE policy an existing file can't be replaced.
create policy "owner menus anon upload" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'owner-menus'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = 'submissions'
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^(0[1-9]|10)\.(jpg|png|webp|heic|heif|pdf)$'
    and mealtree.owner_menus_upload_allowed()
  );

-- Reading (and so signing download URLs) needs the admin token header; see mealtree.is_admin_request().
create policy "owner menus admin read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'owner-menus' and mealtree.is_admin_request());

-- ——— Public: submit ————————————————————————————————————————————————————————

create function mealtree.submit_menu(
  p_id uuid,
  p_restaurant_name text,
  p_maps_url text,
  p_phone text,
  p_contact_name text,
  p_file_paths text[],
  p_source text,
  p_locale text
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_name text := trim(coalesce(p_restaurant_name, ''));
  v_maps text := trim(coalesce(p_maps_url, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_contact text := nullif(trim(coalesce(p_contact_name, '')), '');
  v_paths text[] := coalesce(p_file_paths, '{}');
  v_count int := cardinality(coalesce(p_file_paths, '{}'));
  v_pattern text;
begin
  if p_id is null then
    raise exception 'invalid_input' using errcode = '22023', detail = 'id';
  end if;
  if length(v_name) not between 1 and 160 then
    raise exception 'invalid_input' using errcode = '22023', detail = 'restaurant_name';
  end if;
  -- Mirrors isGoogleMapsLink() in src/lib/surveys.ts.
  if length(v_maps) > 500 or v_maps ~ '\s'
     or v_maps !~* '^(https?://)?(www\.)?(maps\.app\.goo\.gl|g\.page|goo\.gl/maps|maps\.google\.[a-z.]+|google\.[a-z.]+/maps)([/?#:]|$)' then
    raise exception 'invalid_input' using errcode = '22023', detail = 'maps_url';
  end if;
  if v_phone !~ '^\+?[0-9 ()\-.]+$' or length(regexp_replace(v_phone, '\D', '', 'g')) not between 7 and 15 then
    raise exception 'invalid_input' using errcode = '22023', detail = 'phone';
  end if;
  if v_contact is not null and length(v_contact) > 120 then
    raise exception 'invalid_input' using errcode = '22023', detail = 'contact_name';
  end if;

  -- 1 to 10 distinct files, all in this submission's own folder and all actually uploaded.
  if v_count not between 1 and 10 or (select count(distinct x) from unnest(v_paths) x) <> v_count then
    raise exception 'invalid_input' using errcode = '22023', detail = 'file_paths';
  end if;
  v_pattern := '^submissions/' || p_id::text || '/(0[1-9]|10)\.(jpg|png|webp|heic|heif|pdf)$';
  if exists (select 1 from unnest(v_paths) x where x is null or x !~ v_pattern) then
    raise exception 'invalid_input' using errcode = '22023', detail = 'file_paths';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'owner-menus' and name = any(v_paths)) <> v_count then
    raise exception 'files_missing' using errcode = 'P0002';
  end if;

  -- A loose brake against floods; real owners never hit it.
  if (select count(*) from mealtree.menu_submissions where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  -- The id is the upload folder, so a retry after a lost response is a no-op rather than a duplicate.
  insert into mealtree.menu_submissions (id, restaurant_name, maps_url, phone, contact_name, file_paths, source, locale)
  values (
    p_id, v_name, v_maps, v_phone, v_contact, v_paths,
    case when coalesce(p_source, '') ~ '^[a-z_]{1,32}$' then p_source else 'unknown' end,
    case when p_locale in ('en', 'ar') then p_locale end
  )
  on conflict (id) do nothing;
  return p_id;
end;
$$;
revoke all on function mealtree.submit_menu(uuid, text, text, text, text, text[], text, text) from public;
grant execute on function mealtree.submit_menu(uuid, text, text, text, text, text[], text, text) to anon, authenticated;

-- ——— Admin RPCs ———————————————————————————————————————————————————————————

-- The 200 most recent submissions, newest first.
create function mealtree.admin_menu_submissions(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.created_at desc)
    from (select * from mealtree.menu_submissions order by created_at desc limit 200) s
  ), '[]');
end;
$$;

create function mealtree.admin_set_menu_submission_status(p_token text, p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform mealtree.assert_admin(p_token);
  if p_status not in ('new', 'in_progress', 'done', 'rejected') then
    raise exception 'invalid_input' using errcode = '22023', detail = 'status';
  end if;
  update mealtree.menu_submissions
  set status = p_status, note = coalesce(p_note, note), updated_at = now()
  where id = p_id;
  if not found then
    raise exception 'submission_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function
  mealtree.admin_menu_submissions(text),
  mealtree.admin_set_menu_submission_status(text, uuid, text, text)
from public;

-- Callable with the publishable key; each one checks the admin token first.
grant execute on function
  mealtree.admin_menu_submissions(text),
  mealtree.admin_set_menu_submission_status(text, uuid, text, text)
to anon, authenticated;
