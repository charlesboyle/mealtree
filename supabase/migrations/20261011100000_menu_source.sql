-- A venue can send its menu to us directly (e.g. over WhatsApp). That is neither an owner submission,
-- a visit, photos we took, nor the restaurant's website, so give it its own source value.
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'mealtree.restaurants'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%source%';
  if c is not null then execute format('alter table mealtree.restaurants drop constraint %I', c); end if;
end $$;

alter table mealtree.restaurants
  add constraint restaurants_source_check check (source in ('visit', 'photos', 'website', 'owner', 'menu'));
