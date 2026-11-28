\set ON_ERROR_STOP on
begin;
do $$
begin
  if (select count(*) from marine.boat_variants) < 50 then raise exception 'Catalog seed incomplete'; end if;
  if exists (select from marine.boat_variants v where not exists (
    select from marine.specification_observations s where s.variant_id=v.id and s.field='length' and s.current_observation
  )) then raise exception 'Missing length provenance'; end if;
  if not exists (select from marine.price_observations where historical) then raise exception 'Historical prices missing'; end if;
end $$;

create temporary table smoke_target on commit drop as
select variant_id,manufacturer_slug,model_slug from marine.catalog_projection order by variant_id limit 1;
set local role anon;
do $$
begin
  if exists (select from public.marine_catalog_read) then raise exception 'Source rights bypassed'; end if;
  if has_schema_privilege(current_user,'marine','USAGE') then raise exception 'Private schema visible'; end if;
  if has_table_privilege(current_user,'public.marine_catalog_read','INSERT,UPDATE,DELETE') then raise exception 'Public write grants present'; end if;
end $$;
reset role;

select marine.decide_source(id,true,'transactional test') from marine.source_documents;
select marine.decide_variants(array[variant_id],'publish','transactional test','transactional test') from smoke_target;
set local role authenticated;
do $$
begin
  if (select count(*) from public.marine_catalog_read) <> 1 then raise exception 'Approved projection missing'; end if;
  if has_schema_privilege(current_user,'marine','USAGE') then raise exception 'Private schema visible'; end if;
  if has_table_privilege(current_user,'public.marine_catalog_read','INSERT,UPDATE,DELETE') then raise exception 'Authenticated write grants present'; end if;
end $$;
reset role;

update marine.source_documents set expires_on=current_date;
set local role anon;
do $$ begin
  if exists (select from public.marine_catalog_read) then raise exception 'Expired rights bypassed'; end if;
end $$;
reset role;
rollback;
