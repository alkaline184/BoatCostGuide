-- Extend the release gate to all source claims carried by a public snapshot.
create function marine.snapshot_sources(record jsonb)
returns setof jsonb language sql immutable set search_path='' as $$
 select source from (values (record#>'{manufacturer,source}'),(record#>'{model,source}'),
   (record#>'{modelYear,source}'),(record#>'{variant,source}')) identity_claims(source)
 union all
 select value->'source' from pg_catalog.jsonb_each(record#>'{variant,specs}')
 where value->'value' <> 'null'::jsonb
 union all
 select observation->'source' from pg_catalog.jsonb_array_elements(
   (record#>'{variant,prices}') || (record#>'{variant,images}') || (record#>'{variant,recalls}')
 ) observation where observation->'value' <> 'null'::jsonb
$$;
revoke all on function marine.snapshot_sources(jsonb) from public,anon,authenticated;
grant execute on function marine.snapshot_sources(jsonb) to anon,authenticated;

create view public.marine_catalog_read with (security_barrier=true) as
select v.variant_id,v.manufacturer_slug,v.model_slug,v.category_slug,v.model_year,
 v.search_text,v.length_in,v.installed_hp,v.passengers,v.record_data
from public.marine_published_catalog v
where not exists (
 select from marine.snapshot_sources(v.record_data) claim
 left join marine.source_documents d on
  (d.manufacturer_slug,d.url,d.model_year,d.market)=(v.manufacturer_slug,claim->>'url',v.model_year,'US')
 where d.id is null or claim->>'verification' is distinct from 'verified'
 or not(d.commercial_display and d.indexable_display and d.persistent_retention)
 or nullif(trim(d.approval_reference),'') is null or d.expires_on<=current_date
 or claim#>>'{license,status}' is distinct from 'approved'
 or claim#>>'{license,commercialDisplay}' is distinct from 'true'
 or claim#>>'{license,indexableDisplay}' is distinct from 'true'
 or claim#>>'{license,storage}' is distinct from 'persistent'
 or claim#>>'{license,expiresAt}' <= current_date::text
);
revoke all on public.marine_published_catalog from anon,authenticated;
revoke all on public.marine_catalog_read from public,anon,authenticated;
grant select on public.marine_catalog_read to anon,authenticated;

create index catalog_search_family on marine.catalog_projection (manufacturer_slug,model_slug,model_year desc,variant_id);
create index catalog_search_category on marine.catalog_projection (category_slug,model_year desc,variant_id);

create function public.marine_search(q text default '', brand text default '',
 category text default '', scope_brand text default '', scope_category text default '',
 model_year_filter integer default null, min_price numeric default null, max_price numeric default null,
 min_length numeric default null, min_hp numeric default null, min_passengers integer default null,
 propulsion_filter text default '', sort_key text default 'name', page_number integer default 1,
 include_prices boolean default false)
returns jsonb language sql stable security invoker set search_path='' as $$
 with matches as materialized (
  select v.variant_id,v.manufacturer_slug,v.model_slug,v.category_slug,v.model_year,
    v.record_data, priced.value, (priced.value->>'amount')::numeric amount
  from public.marine_catalog_read v
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
    select from pg_catalog.regexp_split_to_table(lower(left(q,100)), '[^a-z0-9]+') token
    where token<>'' and position(token in lower(v.search_text))=0
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
      'images','[]'::jsonb,'prices',case when m.value is null then '[]'::jsonb
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
revoke all on function public.marine_search(text,text,text,text,text,integer,numeric,numeric,numeric,numeric,integer,text,text,integer,boolean) from public;
grant execute on function public.marine_search(text,text,text,text,text,integer,numeric,numeric,numeric,numeric,integer,text,text,integer,boolean) to anon,authenticated;
