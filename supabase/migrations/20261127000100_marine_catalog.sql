create schema marine;
revoke all on schema marine from public, anon, authenticated;
create type marine.review_status as enum ('discovered','extracted','pending_review','verified','approved','published','rejected','archived');
create table marine.manufacturers (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'), name text not null, website text not null,
  aliases text[] not null default '{}', parent_brand text, market text not null default 'US',
  active boolean not null default true, created_at timestamptz not null default now()
);
create table marine.boat_categories (
  slug text primary key, name text not null, parent_slug text references marine.boat_categories,
  guidance text, template_key text not null
);
insert into marine.boat_categories (slug,name,template_key) values
 ('pwc','Personal watercraft','pwc'),('jet','Jet boats','jet'),('pontoon','Pontoons','pontoon'),
 ('bass','Bass boats','bass'),('aluminum','Aluminum fishing boats','aluminum');
create table marine.boat_models (
  manufacturer_slug text references marine.manufacturers, slug text check(slug ~ '^[a-z0-9-]+$'),
  name text not null, category_slug text not null references marine.boat_categories,
  status marine.review_status not null default 'verified', primary key(manufacturer_slug,slug)
);
create table marine.boat_model_years (
  id text primary key, manufacturer_slug text not null, model_slug text not null,
  model_year smallint not null check(model_year between 1900 and 2100), market text not null check(market='US'),
  official_url text not null check(official_url like 'https://%'),
  verified_on date not null, status marine.review_status not null default 'verified',
  foreign key(manufacturer_slug,model_slug) references marine.boat_models,
  unique(manufacturer_slug,model_slug,model_year,market)
);
create table marine.boat_variants (
  id text primary key check(id ~ '^[a-z0-9-]+$'), model_year_id text not null references marine.boat_model_years,
  trim text not null, editorial text not null, intended_use text not null,
  status marine.review_status not null default 'verified', unique(model_year_id,trim)
);
create table marine.source_documents (
  id bigint generated always as identity primary key,
  manufacturer_slug text not null references marine.manufacturers,
  url text not null check(url like 'https://%'), model_year smallint not null, market text not null check(market='US'),
  source_type text not null check(source_type in ('product','pdf','pricing','lineup')),
  accessed_on date not null, restrictions jsonb not null,
  commercial_display boolean not null default false, indexable_display boolean not null default false,
  persistent_retention boolean not null default false, approval_reference text, expires_on date,
  unique(manufacturer_slug,url,model_year,market)
);
create table marine.boat_specifications (
  variant_id text primary key references marine.boat_variants,
  length_in numeric not null check(length_in>0), beam_in numeric check(beam_in>0),
  draft_in numeric check(draft_in>0), dry_weight_lb numeric check(dry_weight_lb>0), dry_weight_basis text,
  installed_hp numeric check(installed_hp>0), max_supported_hp numeric check(max_supported_hp>0),
  engine_count smallint check(engine_count between 1 and 6), displacement_cc numeric check(displacement_cc>0),
  fuel_us_gal numeric check(fuel_us_gal>0), passengers smallint check(passengers>0),
  storage_us_gal numeric check(storage_us_gal>0), hull_material text, propulsion text, details jsonb not null
);
create table marine.specification_observations (
  id bigint generated always as identity primary key, variant_id text not null references marine.boat_variants,
  field text not null, original_value jsonb not null, original_unit text,
  normalized_value jsonb not null, normalized_unit text, source_document_id bigint not null references marine.source_documents,
  observed_on date not null, verified boolean not null default true, current_observation boolean not null default true,
  supersedes_id bigint references marine.specification_observations,
  unique(variant_id,field,source_document_id,observed_on,normalized_value,original_value)
);
create unique index one_current_spec on marine.specification_observations(variant_id,field) where current_observation;
create table marine.price_observations (
  id bigint generated always as identity primary key, variant_id text not null references marine.boat_variants,
  amount numeric(12,2) not null check(amount>0), currency text not null check(currency='USD'),
  kind text not null check(kind in ('msrp','manufacturer-starting','base-package','promotional','dealer-asking','actual-sale','estimated-market')),
  historical boolean not null, observed_on date not null, includes jsonb not null, excludes jsonb not null,
  source_document_id bigint not null references marine.source_documents, verified boolean not null default true,
  unique(variant_id,source_document_id,observed_on,kind,amount)
);
create table marine.illustration_configurations (
  variant_id text primary key references marine.boat_variants, template_key text not null,
  verified_attributes jsonb not null default '{}', reviewed_override text, checked_on date
);
create table marine.ingestion_runs (
  id bigint generated always as identity primary key, completed_at timestamptz not null default now(),
  adapter text not null, status text not null, requests integer not null default 0 check(requests>=0),
  seen integer not null, added integer not null, changed integer not null, elapsed_ms numeric
);
create table marine.catalog_review_items (
  id bigint generated always as identity primary key, variant_id text references marine.boat_variants,
  kind text not null, details jsonb not null, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table marine.catalog_projection (
  variant_id text primary key references marine.boat_variants,
  manufacturer_slug text not null, model_slug text not null, category_slug text not null, model_year smallint not null,
  search_text text not null, search_vector tsvector generated always as (to_tsvector('simple',search_text)) stored,
  record_data jsonb not null, approved_snapshot jsonb, approved_at timestamptz, approved_by text
);
create index catalog_filters on marine.catalog_projection(manufacturer_slug,category_slug,model_year);
create index catalog_model_lookup on marine.catalog_projection(manufacturer_slug,model_slug);
create index catalog_fts on marine.catalog_projection using gin(search_vector);
create index catalog_numeric_filters on marine.boat_specifications(length_in,installed_hp,passengers);
create index catalog_price_lookup on marine.price_observations(variant_id,observed_on desc);
create index catalog_observation_source on marine.specification_observations(source_document_id,variant_id);
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname='marine' loop
    execute format('alter table marine.%I enable row level security',t);
  end loop;
end $$;
-- Only this explicit projection is exposed. Its owner can read the private base tables.
create view public.marine_published_catalog with (security_barrier=true) as
select p.variant_id,p.manufacturer_slug,p.model_slug,p.category_slug,p.model_year,p.search_text,
       s.length_in,s.installed_hp,s.passengers,
       p.approved_snapshot as record_data
from marine.catalog_projection p
join marine.boat_variants v on v.id=p.variant_id
join marine.boat_model_years y on y.id=v.model_year_id
join marine.boat_models m on (m.manufacturer_slug,m.slug)=(y.manufacturer_slug,y.model_slug)
join marine.boat_specifications s on s.variant_id=v.id
where v.status='published' and y.status='published' and m.status='published'
and p.approved_snapshot is not null and p.approved_snapshot = p.record_data
and p.approved_at is not null and nullif(trim(p.approved_by),'') is not null
and exists (select 1 from marine.specification_observations o where o.variant_id=v.id and o.field='length' and o.current_observation)
and not exists (
  select 1 from (
    select o.source_document_id,o.verified from marine.specification_observations o where o.variant_id=v.id and o.current_observation
    union all select q.source_document_id,q.verified from marine.price_observations q where q.variant_id=v.id
    union all
    select d.id, evidence->>'verification'='verified'
    from (values (p.record_data#>'{manufacturer,source}'),(p.record_data#>'{model,source}'),
      (p.record_data#>'{modelYear,source}'),(p.record_data#>'{variant,source}')) linked(evidence)
    left join marine.source_documents d on (d.manufacturer_slug,d.url,d.model_year,d.market)
      =(p.manufacturer_slug,evidence->>'url',p.model_year,'US')
  ) claims left join marine.source_documents d on d.id=claims.source_document_id
  where d.id is null or claims.verified is distinct from true or not(d.commercial_display and d.indexable_display and d.persistent_retention)
  or nullif(trim(d.approval_reference),'') is null or d.expires_on<=current_date
);
revoke all on public.marine_published_catalog from public, anon, authenticated;
grant select on public.marine_published_catalog to anon,authenticated;

create function marine.remember_source(brand text, year smallint, evidence jsonb, kind text)
returns bigint language plpgsql set search_path='' as $$
declare result bigint;
begin
 insert into marine.source_documents(manufacturer_slug,url,model_year,market,source_type,accessed_on,restrictions)
 values(brand,evidence->>'url',year,'US',case when evidence->>'url' ilike '%.pdf' or evidence->>'url' like '%ProductSpecSheetPDF/%' then 'pdf' else kind end,
 (evidence->>'retrievedAt')::date,coalesce(evidence#>'{license,restrictions}','[]'::jsonb))
 on conflict(manufacturer_slug,url,model_year,market) do update
 set accessed_on=greatest(marine.source_documents.accessed_on,excluded.accessed_on)
 returning id into result;
 return result;
end $$;

create function marine.import_catalog(input jsonb) returns jsonb
language plpgsql set search_path='' as $$
declare item jsonb; r jsonb; specs jsonb; spec jsonb; price jsonb; original jsonb; fact_key text;
 brand text; model_key text; category text; y smallint; v text; year_id text;
 source_id bigint; prior_id bigint; field_id bigint; old_snapshot jsonb; length numeric;
 additions integer:=0; changes integer:=0; started timestamptz:=clock_timestamp();
begin
 perform pg_advisory_xact_lock(49170302);
 for item in select value from jsonb_array_elements(input) loop
  r:=item->'record'; brand:=r#>>'{manufacturer,id}'; model_key:=r#>>'{model,id}'; category:=r#>>'{model,category}';
  y:=(r#>>'{modelYear,year}')::smallint; year_id:=r#>>'{modelYear,id}'; v:=r#>>'{variant,id}';
  specs:=r#>'{variant,specs}';
  if r#>>'{modelYear,market}' is distinct from 'US' or r#>>'{model,manufacturerId}' is distinct from brand
   or r#>>'{modelYear,modelId}' is distinct from model_key
   or r#>>'{variant,modelYearId}' is distinct from year_id then raise exception 'Invalid catalog identity'; end if;
  insert into marine.manufacturers(slug,name,website) values(brand,r#>>'{manufacturer,name}',r#>>'{manufacturer,website}')
   on conflict(slug) do update set name=excluded.name,website=excluded.website;
  insert into marine.boat_models(manufacturer_slug,slug,name,category_slug)
   values(brand,model_key,r#>>'{model,name}',category)
   on conflict(manufacturer_slug,slug) do update set name=excluded.name,category_slug=excluded.category_slug;
  insert into marine.boat_model_years(id,manufacturer_slug,model_slug,model_year,market,official_url,verified_on)
   values(year_id,brand,model_key,y,'US',r#>>'{modelYear,source,url}',(r#>>'{modelYear,source,retrievedAt}')::date)
   on conflict(id) do update set official_url=excluded.official_url,verified_on=excluded.verified_on
   where (marine.boat_model_years.manufacturer_slug,marine.boat_model_years.model_slug,marine.boat_model_years.model_year)=(brand,model_key,y);
  if not found then raise exception 'Model-year identity changed'; end if;
  perform marine.remember_source(brand,y,r#>'{manufacturer,source}','lineup');
  perform marine.remember_source(brand,y,r#>'{model,source}','product');
  perform marine.remember_source(brand,y,r#>'{modelYear,source}','lineup');
  perform marine.remember_source(brand,y,r#>'{variant,source}','product');
  insert into marine.boat_variants(id,model_year_id,trim,editorial,intended_use)
   values(v,year_id,r#>>'{variant,name}',r->>'editorial',r->>'intendedUse')
   on conflict(id) do update set editorial=excluded.editorial,intended_use=excluded.intended_use
   where (marine.boat_variants.model_year_id,marine.boat_variants.trim)=(year_id,excluded.trim);
  if not found then raise exception 'Variant identity changed'; end if;
  select record_data into old_snapshot from marine.catalog_projection where variant_id=v;
  if old_snapshot is null then additions:=additions+1;
  elsif old_snapshot is distinct from r then
   changes:=changes+1;
   insert into marine.catalog_review_items(variant_id,kind,details) values(v,'changed_record',
      jsonb_build_object('previous',old_snapshot,'proposed',r));
  end if;
  length:=(specs#>>'{length,value,amount}')::numeric;
  insert into marine.boat_specifications values(v,length,(specs#>>'{beam,value,amount}')::numeric,
   (specs#>>'{draft,value,amount}')::numeric,(specs#>>'{dryWeight,value,amount}')::numeric,
   specs#>>'{dryWeightBasis,value}',(specs#>>'{engine,value,totalPower,amount}')::numeric,null,
   (specs#>>'{engine,value,count}')::smallint,(specs#>>'{engine,value,displacement,amount}')::numeric,
   (specs#>>'{fuelCapacity,value,amount}')::numeric,(specs#>>'{passengers,value,amount}')::smallint,
   (specs#>>'{storageCapacity,value,amount}')::numeric,specs#>>'{hullMaterial,value}',specs#>>'{engine,value,type}',specs)
   on conflict(variant_id) do update set length_in=excluded.length_in,beam_in=excluded.beam_in,
   draft_in=excluded.draft_in,dry_weight_lb=excluded.dry_weight_lb,dry_weight_basis=excluded.dry_weight_basis,
   installed_hp=excluded.installed_hp,engine_count=excluded.engine_count,displacement_cc=excluded.displacement_cc,
   fuel_us_gal=excluded.fuel_us_gal,passengers=excluded.passengers,storage_us_gal=excluded.storage_us_gal,
   hull_material=excluded.hull_material,propulsion=excluded.propulsion,details=excluded.details;
  update marine.specification_observations o set current_observation=false where o.variant_id=v and o.current_observation
   and coalesce(jsonb_typeof(specs->o.field->'value'),'null')='null';
  for fact_key,spec in select key,value from jsonb_each(specs) where value->'value' <> 'null'::jsonb loop
   source_id:=marine.remember_source(brand,y,spec->'source','product');
   original:=coalesce(item->'original'->fact_key,spec->'value');
   select id into prior_id from marine.specification_observations where variant_id=v and marine.specification_observations.field=fact_key and current_observation;
   update marine.specification_observations set current_observation=false where id=prior_id;
   insert into marine.specification_observations(variant_id,field,original_value,original_unit,normalized_value,normalized_unit,source_document_id,observed_on,verified,supersedes_id)
   values(v,fact_key,coalesce(original->'value',original->'amount',original), original->>'unit',
   spec->'value',spec#>>'{value,unit}',source_id,(spec#>>'{source,retrievedAt}')::date,spec#>>'{source,verification}'='verified',prior_id)
   on conflict do nothing returning id into field_id;
   if field_id is null then
    update marine.specification_observations o set current_observation=true
    where o.variant_id=v and o.field=fact_key and o.source_document_id=source_id
    and o.observed_on=(spec#>>'{source,retrievedAt}')::date and o.normalized_value=spec->'value'
    and o.original_value=coalesce(original->'value',original->'amount',original);
   end if;
  end loop;
  for price in select value from jsonb_array_elements(r#>'{variant,prices}') where value->'value'<>'null'::jsonb loop
   source_id:=marine.remember_source(brand,y,price->'source','pricing');
   insert into marine.price_observations(variant_id,amount,currency,kind,historical,observed_on,includes,excludes,source_document_id,verified)
   values(v,(price#>>'{value,amount}')::numeric,price#>>'{value,currency}',
    case when price#>>'{value,label}'='National base package price' then 'base-package' else price#>>'{value,kind}' end,
    coalesce((price#>>'{value,historical}')::boolean,false),(price#>>'{value,observedAt}')::date,
    coalesce(price#>'{value,includedItems}','[]'::jsonb),coalesce(price#>'{value,excludedItems}','[]'::jsonb),source_id,
    price#>>'{source,verification}'='verified') on conflict do nothing;
  end loop;
  insert into marine.illustration_configurations(variant_id,template_key,verified_attributes)
   values(v,coalesce(item#>>'{diagram,template}',category),jsonb_strip_nulls(jsonb_build_object('lengthIn',length,'beamIn',item#>'{diagram,beam}','propulsion',specs#>>'{engine,value,type}'))) on conflict(variant_id) do update set template_key=excluded.template_key,verified_attributes=excluded.verified_attributes;
  insert into marine.catalog_projection(variant_id,manufacturer_slug,model_slug,category_slug,model_year,search_text,record_data)
   values(v,brand,model_key,category,y,concat_ws(' ',r#>>'{manufacturer,name}',r#>>'{model,name}',r#>>'{variant,name}',y::text),r)
   on conflict(variant_id) do update set category_slug=excluded.category_slug,search_text=excluded.search_text,record_data=excluded.record_data;
 end loop;
 insert into marine.ingestion_runs(adapter,status,seen,added,changed,elapsed_ms)
 values('editorial-batch-v1','complete',jsonb_array_length(input),additions,changes,extract(epoch from clock_timestamp()-started)*1000);
 return jsonb_build_object('seen',jsonb_array_length(input),'added',additions,'changed',changes);
end $$;
revoke execute on all functions in schema marine from public,anon,authenticated;
