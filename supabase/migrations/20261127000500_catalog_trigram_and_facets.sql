-- Materialize source identities at approval time. Check live rights every read.
create table marine.publication_source_claims (
 variant_id text not null references marine.catalog_projection on delete cascade,
 ordinal bigint not null,
 source_document_id bigint references marine.source_documents,
 license_verified boolean not null,
 snapshot_expires date,
 primary key (variant_id,ordinal)
);
alter table marine.publication_source_claims enable row level security;
create index publication_source_document on marine.publication_source_claims(source_document_id,variant_id);

create function marine.refresh_publication_claims() returns trigger
language plpgsql set search_path='' as $$
begin
 delete from marine.publication_source_claims where variant_id=new.variant_id;
 if new.approved_snapshot is not null then
  insert into marine.publication_source_claims(variant_id,ordinal,source_document_id,license_verified,snapshot_expires)
  select new.variant_id,position,d.id,coalesce(
   claim->>'verification'='verified' and claim#>>'{license,status}'='approved'
     and claim#>>'{license,commercialDisplay}'='true' and claim#>>'{license,indexableDisplay}'='true'
     and claim#>>'{license,storage}'='persistent',false
  ),(claim#>>'{license,expiresAt}')::date
  from marine.snapshot_sources(new.approved_snapshot) with ordinality s(claim,position)
  left join marine.source_documents d on (d.manufacturer_slug,d.url,d.model_year,d.market)
    =(new.manufacturer_slug,claim->>'url',new.model_year,'US');
 end if;
 return new;
end $$;
revoke all on function marine.refresh_publication_claims() from public,anon,authenticated;
create trigger refresh_catalog_publication_claims
 after insert or update of approved_snapshot on marine.catalog_projection
 for each row execute function marine.refresh_publication_claims();
update marine.catalog_projection set approved_snapshot=approved_snapshot where approved_snapshot is not null;

create or replace view public.marine_catalog_read with (security_barrier=true) as
select p.variant_id,p.manufacturer_slug,p.model_slug,p.category_slug,p.model_year,
 p.search_text,s.length_in,s.installed_hp,s.passengers,p.approved_snapshot record_data
from marine.catalog_projection p
join marine.boat_variants v on v.id=p.variant_id
join marine.boat_model_years y on y.id=v.model_year_id
join marine.boat_models m on (m.manufacturer_slug,m.slug)=(y.manufacturer_slug,y.model_slug)
join marine.boat_specifications s on s.variant_id=v.id
where v.status='published' and y.status='published' and m.status='published'
 and p.approved_at is not null and nullif(trim(p.approved_by),'') is not null
 and p.approved_candidate=p.record_data and p.approved_snapshot is not null
 and exists(select from marine.publication_source_claims c where c.variant_id=v.id)
 and not exists(
  select from marine.publication_source_claims c
  left join marine.source_documents d on d.id=c.source_document_id
  where c.variant_id=v.id and (
   not c.license_verified or c.snapshot_expires<=current_date or d.id is null
   or not(d.commercial_display and d.indexable_display and d.persistent_retention)
   or nullif(trim(d.approval_reference),'') is null or d.expires_on<=current_date
  )
 );
-- Match the longest literal token with trigrams before applying the complete token check.
-- Only the existing rights-gated view leaves the function.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create index catalog_search_trigrams on marine.catalog_projection using gin (lower(search_text) extensions.gin_trgm_ops);

create or replace function public.marine_search(q text default '', brand text default '',
 category text default '', scope_brand text default '', scope_category text default '',
 model_year_filter integer default null, min_price numeric default null, max_price numeric default null,
 min_length numeric default null, min_hp numeric default null, min_passengers integer default null,
 propulsion_filter text default '', sort_key text default 'name', page_number integer default 1,
 include_prices boolean default false)
returns jsonb language sql stable security definer set search_path='' set jit=off set enable_nestloop=off as $$
 with tokens as materialized (
  select token from pg_catalog.regexp_split_to_table(lower(left(q,100)), '[^a-z0-9]+') token where token<>''
 ), candidates as materialized (
  select variant_id from marine.catalog_projection p
  where (brand='' or p.manufacturer_slug=brand) and (scope_brand='' or p.manufacturer_slug=scope_brand)
   and (category='' or p.category_slug=category) and (scope_category='' or p.category_slug=scope_category)
   and (model_year_filter is null or p.model_year=model_year_filter)
   and lower(p.search_text) like '%'||coalesce((select token from tokens order by length(token) desc limit 1),'')||'%'
 ), matches as materialized (
  select v.variant_id,v.manufacturer_slug,v.model_slug,v.category_slug,v.model_year,
    v.record_data, priced.value, (priced.value->>'amount')::numeric amount
  from candidates c join public.marine_catalog_read v on v.variant_id=c.variant_id
  left join lateral (
    select obs->'value' value
    from pg_catalog.jsonb_array_elements(v.record_data#>'{variant,prices}') obs
    where obs#>>'{value,kind}' in ('msrp','manufacturer-starting')
     and obs#>>'{value,currency}'='USD' and (obs#>>'{value,amount}')::numeric between 0.01 and 25000000
     and coalesce(obs#>>'{value,historical}','false')='false'
     and (obs#>>'{value,observedAt}')::date between current_date-180 and current_date
    order by obs#>>'{value,observedAt}' desc limit 1
  ) priced on true
  where (brand='' or v.manufacturer_slug=brand) and (scope_brand='' or v.manufacturer_slug=scope_brand)
   and (category='' or v.category_slug=category) and (scope_category='' or v.category_slug=scope_category)
   and (model_year_filter is null or v.model_year=model_year_filter)
   and (min_price is null or (priced.value->>'amount')::numeric >= min_price)
   and (max_price is null or (priced.value->>'amount')::numeric <= max_price)
   and (min_length is null or v.length_in >= min_length*12)
   and (min_hp is null or v.installed_hp >= min_hp)
   and (min_passengers is null or v.passengers >= min_passengers)
   and (propulsion_filter='' or v.record_data#>>'{variant,specs,engine,value,type}'=propulsion_filter)
   and not exists (
    select from tokens where position(token in lower(v.search_text))=0
   )
 ), bounds as (
  select count(*) count,greatest(1,ceil(count(*)/24.0)::int) last from matches
 ), paging as (
  select count,last,least(last,greatest(page_number,1)) current from bounds
 ), ordered as (
  select m.*,row_number() over(order by
    case when include_prices or sort_key in ('price','payment') then amount end nulls last,
    case when sort_key='year' and not include_prices then model_year end desc nulls last,
    variant_id) position
  from matches m
 )
 select jsonb_build_object('count',p.count,'last',p.last,'current',p.current,'rows',coalesce((
   select jsonb_agg(jsonb_build_object(
    'manufacturer',jsonb_build_object('id',m.manufacturer_slug,'name',m.record_data#>>'{manufacturer,name}'),
    'model',jsonb_build_object('id',m.model_slug,'name',m.record_data#>>'{model,name}','category',m.category_slug),
    'modelYear',jsonb_build_object('year',m.model_year),
    'variant',jsonb_build_object('id',m.variant_id,'name',m.record_data#>'{variant,name}',
      'images',m.record_data#>'{variant,images}','prices',case when m.value is null then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object('value',m.value)) end,
      'specs',jsonb_build_object(
        'length',jsonb_build_object('value',m.record_data#>'{variant,specs,length,value}'),
        'beam',jsonb_build_object('value',m.record_data#>'{variant,specs,beam,value}'),
        'widthBasis',jsonb_build_object('value',m.record_data#>'{variant,specs,widthBasis,value}'),
        'passengers',jsonb_build_object('value',m.record_data#>'{variant,specs,passengers,value}'),
        'engine',jsonb_build_object('value',jsonb_build_object('type',m.record_data#>'{variant,specs,engine,value,type}'))
      ))) order by m.position)
   from ordered m where m.position between (p.current-1)*24+1 and p.current*24
 ),'[]'::jsonb)) ||
 case when include_prices then jsonb_build_object('prices',
   coalesce((select jsonb_agg(amount order by amount) from matches where amount is not null),'[]'::jsonb))
 else '{}'::jsonb end
 from paging p
$$;

create function public.marine_catalog_facets(scope_brand text default '', scope_category text default '')
returns jsonb language sql stable security invoker set search_path='' as $$
 with choices as materialized (
  select manufacturer_slug,record_data#>>'{manufacturer,name}' manufacturer_name,model_year,
   record_data#>>'{variant,specs,engine,value,type}' propulsion
  from public.marine_catalog_read
  where (scope_brand='' or manufacturer_slug=scope_brand)
    and (scope_category='' or category_slug=scope_category)
 )
 select jsonb_build_object(
  'brands',coalesce((select jsonb_agg(jsonb_build_array(manufacturer_slug,manufacturer_name)) from
    (select distinct manufacturer_slug,manufacturer_name from choices order by manufacturer_name) brands),'[]'::jsonb),
  'years',coalesce((select jsonb_agg(distinct model_year order by model_year desc) from choices),'[]'::jsonb),
  'propulsion',coalesce((select jsonb_agg(distinct propulsion order by propulsion) from choices where propulsion is not null),'[]'::jsonb))
$$;
revoke all on function public.marine_catalog_facets(text,text) from public;
grant execute on function public.marine_catalog_facets(text,text) to anon,authenticated;
