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
update marine.catalog_projection p set approved_snapshot=record_data,approved_at=now(),approved_by='transactional test'
from smoke_target t where p.variant_id=t.variant_id;
update marine.boat_variants v set status='published' from smoke_target t where v.id=t.variant_id;
update marine.boat_model_years y set status='published' from marine.boat_variants v join smoke_target t on t.variant_id=v.id where y.id=v.model_year_id;
update marine.boat_models m set status='published' from smoke_target t where (m.manufacturer_slug,m.slug)=(t.manufacturer_slug,t.model_slug);

set local role anon;
do $$
begin
  if exists (select from public.marine_published_catalog) then raise exception 'Source rights bypassed'; end if;
  if has_schema_privilege(current_user,'marine','USAGE') then raise exception 'Private schema visible'; end if;
  if has_table_privilege(current_user,'public.marine_published_catalog','INSERT,UPDATE,DELETE') then raise exception 'Public write grants present'; end if;
end $$;
reset role;

update marine.source_documents set commercial_display=true,indexable_display=true,persistent_retention=true,approval_reference='transactional test';
set local role authenticated;
do $$
begin
  if (select count(*) from public.marine_published_catalog) <> 1 then raise exception 'Approved projection missing'; end if;
  if has_schema_privilege(current_user,'marine','USAGE') then raise exception 'Private schema visible'; end if;
  if has_table_privilege(current_user,'public.marine_published_catalog','INSERT,UPDATE,DELETE') then raise exception 'Authenticated write grants present'; end if;
end $$;
reset role;

update marine.source_documents set expires_on=current_date;
set local role anon;
do $$ begin
  if exists (select from public.marine_published_catalog) then raise exception 'Expired rights bypassed'; end if;
end $$;
reset role;
rollback;
