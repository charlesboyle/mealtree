-- Original menu files ("view original menu"): which files we built a page from and when the
-- restaurant sent them, so the page never claims more than we can show.
--
--   mealtree.restaurants.menu_files = {"received": "2026-09-30", "files": [{"path": "<slug>/01.jpg", "type": "image" | "pdf"}]}
--
-- Files live in the public Storage bucket `menus` (public URL: <supabase>/storage/v1/object/public/menus/<path>).
-- Uploads are allowed only with an admin token sent in the `x-admin-token` header (checked against
-- mealtree.admin_keys), so no service_role key is needed. Like the other mealtree migrations, apply it
-- manually; it is not recorded in Ketticho's supabase_migrations history.

alter table mealtree.restaurants add column if not exists menu_files jsonb;

-- True when the current API request carries a valid admin token header.
create or replace function mealtree.is_admin_request() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from mealtree.admin_keys
    where token_hash = sha256(convert_to(coalesce((nullif(current_setting('request.headers', true), '')::json) ->> 'x-admin-token', ''), 'UTF8'))
  );
$$;
revoke all on function mealtree.is_admin_request() from public;
grant execute on function mealtree.is_admin_request() to anon, authenticated;

create or replace function mealtree.admin_set_menu_files(p_token text, p_slug text, p_data jsonb) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_slug text;
begin
  perform mealtree.assert_admin(p_token);
  update mealtree.restaurants set menu_files = p_data where slug = p_slug returning slug into v_slug;
  return v_slug;
end;
$$;
revoke all on function mealtree.admin_set_menu_files(text, text, jsonb) from public;
grant execute on function mealtree.admin_set_menu_files(text, text, jsonb) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menus', 'menus', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "menus are readable" on storage.objects for select to anon, authenticated
  using (bucket_id = 'menus');
create policy "menus admin insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'menus' and mealtree.is_admin_request());
create policy "menus admin update" on storage.objects for update to anon, authenticated
  using (bucket_id = 'menus' and mealtree.is_admin_request())
  with check (bucket_id = 'menus' and mealtree.is_admin_request());
create policy "menus admin delete" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'menus' and mealtree.is_admin_request());
