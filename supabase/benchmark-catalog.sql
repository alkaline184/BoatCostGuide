\set ON_ERROR_STOP on
\timing on
begin;
-- Execute only in an isolated test database. All generated data is rolled back.
select current_database() = 'boatcostguide_catalog_benchmark' as is_benchmark \gset
\if :is_benchmark
\else
  \echo 'Run only in the explicitly named isolated benchmark database'
  \quit 2
\endif
insert into marine.manufacturers(slug,name,website) values ('synthetic','Synthetic','https://example.invalid/');
insert into marine.source_documents(manufacturer_slug,url,model_year,market,source_type,accessed_on,restrictions,
 commercial_display,indexable_display,persistent_retention,approval_reference)
values ('synthetic','https://example.invalid/specs',2027,'US','product',current_date,'[]',true,true,true,'Synthetic benchmark');
create temp table seed on commit drop as
select n,'synthetic-'||lpad(n::text,5,'0') id,'fixture-'||((n-1)/5) family,
 case when n%2=0 then 'pwc' else 'jet' end category,100+(n%140) length,50+(n%240) hp,
 2+(n%8) passengers,5000+n price,
 jsonb_build_object('url','https://example.invalid/specs','provider','fixture-benchmark','retrievedAt',current_date,'verification','verified',
  'license',jsonb_build_object('status','approved','storage','persistent','commercialDisplay',true,'indexableDisplay',true,'expiresAt',null)) source
from generate_series(1,:size) n;
insert into marine.boat_models(manufacturer_slug,slug,name,category_slug,status)
select 'synthetic',family,family,min(category),'published' from seed group by family;
insert into marine.boat_model_years(id,manufacturer_slug,model_slug,model_year,market,official_url,verified_on,status)
select distinct family||'-2027','synthetic',family,2027,'US','https://example.invalid/specs',current_date,'published'::marine.review_status from seed;
insert into marine.boat_variants(id,model_year_id,trim,editorial,intended_use,status)
select id,family||'-2027',id,'Synthetic','Synthetic','published' from seed;
insert into marine.boat_specifications(variant_id,length_in,installed_hp,passengers,details)
select id,length,hp,passengers,'{}' from seed;
insert into marine.specification_observations(variant_id,field,original_value,normalized_value,source_document_id,observed_on)
select s.id,'length',to_jsonb(s.length),to_jsonb(s.length),d.id,current_date
from seed s cross join marine.source_documents d where d.manufacturer_slug='synthetic';
insert into marine.catalog_projection(variant_id,manufacturer_slug,model_slug,category_slug,model_year,search_text,
 record_data,approved_snapshot,approved_candidate,approved_at,approved_by)
select id,'synthetic',family,category,2027,'Synthetic '||family||' '||id,record,record,record,now(),'Synthetic benchmark'
from seed cross join lateral (select jsonb_build_object(
 'manufacturer',jsonb_build_object('name','Synthetic','source',source),
 'model',jsonb_build_object('name',family,'source',source),'modelYear',jsonb_build_object('source',source),
 'variant',jsonb_build_object('name',id,'source',source,'images','[]'::jsonb,'recalls','[]'::jsonb,
 'specs',jsonb_build_object('length',jsonb_build_object('value',jsonb_build_object('amount',length,'unit','in'),'source',source)),
 'prices',jsonb_build_array(jsonb_build_object('value',jsonb_build_object('kind','msrp','amount',price,'currency','USD',
 'observedAt',current_date),'source',source)))) record) r;
analyze marine.catalog_projection;
analyze marine.boat_variants;
analyze marine.specification_observations;
analyze marine.publication_source_claims;
analyze marine.boat_model_years;
analyze marine.boat_models;
analyze marine.boat_specifications;
analyze marine.source_documents;
set local role anon;
\echo === filtered search with exact count and page 2 ===
select result->>'count' as matched,result->>'current' as page,jsonb_array_length(result->'rows') as cards,
 octet_length(result::text) as bytes
from public.marine_search(q=>'synthetic',category=>'pwc',min_price=>5010,min_hp=>90,sort_key=>'price',page_number=>2) result;
explain(analyze,buffers) select public.marine_search(q=>'synthetic',category=>'pwc',min_price=>5010,min_hp=>90,sort_key=>'price',page_number=>2);
\echo === indexed model-family and comparison lookups ===
explain(analyze,buffers) select variant_id from public.marine_catalog_read where manufacturer_slug='synthetic' and model_slug='fixture-1';
explain(analyze,buffers) select variant_id from public.marine_catalog_read where variant_id in ('synthetic-00001','synthetic-00002','synthetic-00003');
reset role;
select :size = 100 as test_admin \gset
\if :test_admin
select marine.decide_variants(array['synthetic-00001'],'unpublish','Synthetic benchmark','Rollback test');
set local role anon;
do $$ begin
  if exists (select from public.marine_catalog_read where variant_id='synthetic-00001')
  then raise exception 'Unpublish failed'; end if;
  if has_schema_privilege('anon','marine','USAGE')
  then raise exception 'Private schema exposed'; end if;
  if (public.marine_search(q=>'synthetic-00002')->>'count')::int <> 1
  then raise exception 'Filtered result count incorrect'; end if;
end $$;
reset role;
select marine.decide_variants(array['synthetic-00001'],'publish','Synthetic benchmark','Rollback test');
select marine.decide_source(id,false,'Rollback test') from marine.source_documents where manufacturer_slug='synthetic';
set local role authenticated;
do $$ begin
 if (public.marine_search(q=>'synthetic')->>'count')::int <> 0
 then raise exception 'Revocation failed'; end if;
end $$;
reset role;
-- Normalized, fictional input demonstrates one price revision and an identical replay.
create temporary table synthetic_refresh(payload jsonb) on commit drop;
insert into synthetic_refresh
select jsonb_set(
  jsonb_set(jsonb_set(jsonb_set(jsonb_set(record_data,
   '{manufacturer}', (record_data->'manufacturer') || '{"id":"synthetic","website":"https://example.invalid"}'),
   '{model}',(record_data->'model') || jsonb_build_object('id',model_slug,'manufacturerId','synthetic','category',category_slug)),
   '{modelYear}',(record_data->'modelYear') || jsonb_build_object('id',model_slug||'-2027','modelId',model_slug,'year',2027,'market','US')),
   '{variant}',(record_data->'variant') || jsonb_build_object('id',variant_id,'modelYearId',model_slug||'-2027')),
   '{editorial}','"Synthetic benchmark"'::jsonb
 ) || '{"intendedUse":"Synthetic benchmark"}'
from marine.catalog_projection where variant_id='synthetic-00002';
select marine.import_catalog(jsonb_build_array(jsonb_build_object('record',payload))) from synthetic_refresh;
update synthetic_refresh set payload=jsonb_set(payload,'{variant,prices,0,value,amount}','8000');
select marine.import_catalog(jsonb_build_array(jsonb_build_object('record',payload))) from synthetic_refresh;
select marine.import_catalog(jsonb_build_array(jsonb_build_object('record',payload))) from synthetic_refresh;
do $$ begin
 if (select count(*) from marine.price_observations where variant_id='synthetic-00002') <> 2
    or (select count(*) from marine.catalog_review_items where variant_id='synthetic-00002' and kind='changed_record') <> 2
 then raise exception 'Price history or replay invariants failed'; end if;
end $$;
\endif
rollback;
