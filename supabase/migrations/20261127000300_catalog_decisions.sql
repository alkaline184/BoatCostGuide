-- Source decisions apply by exact document, US model year and manufacturer.
create function marine.decide_source(document_id bigint, decision boolean, basis text, expires date default null)
returns void language plpgsql set search_path='' as $$
begin
 if decision is null or nullif(trim(basis),'') is null or
    (decision and expires is not null and expires<=current_date)
 then raise exception 'A verified decision basis and valid expiration are required'; end if;
 update marine.source_documents
 set commercial_display=decision,indexable_display=decision,persistent_retention=decision,
  approval_reference=basis,expires_on=expires
 where id=document_id;
 if not found then raise exception 'Source document not found'; end if;
end $$;

create function marine.edit_claims(node jsonb, brand text, model_year smallint, enrich boolean)
returns jsonb language plpgsql stable set search_path='' as $$
declare doc marine.source_documents%rowtype;
begin
 case pg_catalog.jsonb_typeof(node)
 when 'object' then
  if node ?& array['url','license','verification','provider'] then
   if not enrich then return node-'license'; end if;
   select d.* into doc from marine.source_documents d where
     (d.manufacturer_slug,d.url,d.model_year,d.market)=(brand,node->>'url',model_year,'US');
   if not found or not(doc.commercial_display and doc.indexable_display and doc.persistent_retention)
      or nullif(trim(doc.approval_reference),'') is null or doc.expires_on<=current_date
      or node->>'verification' is distinct from 'verified'
   then return node; end if;
   return pg_catalog.jsonb_set(node,'{license}', (node->'license') || pg_catalog.jsonb_build_object(
       'status','approved','storage','persistent','commercialDisplay',true,
       'indexableDisplay',true,'expiresAt',doc.expires_on));
  end if;
  return coalesce((select pg_catalog.jsonb_object_agg(key,marine.edit_claims(value,brand,model_year,enrich))
   from pg_catalog.jsonb_each(node)),'{}'::jsonb);
 when 'array' then
  return coalesce((select pg_catalog.jsonb_agg(marine.edit_claims(value,brand,model_year,enrich) order by position)
   from pg_catalog.jsonb_array_elements(node) with ordinality arr(value,position)),'[]'::jsonb);
 else return node;
 end case;
end $$;

create function marine.preview_snapshot(variant_key text)
returns jsonb language sql stable set search_path='' as $$
 select marine.edit_claims(p.record_data,p.manufacturer_slug,p.model_year,true)
 from marine.catalog_projection p where p.variant_id=variant_key
$$;

create function marine.decide_variants(variant_keys text[], decision text, reviewer text, basis text)
returns integer language plpgsql set search_path='' as $$
declare candidate record; snapshot jsonb; decided integer:=0;
begin
 if decision is null or decision not in ('publish','unpublish','reject') or
    nullif(trim(reviewer),'') is null or nullif(trim(basis),'') is null or
    coalesce(cardinality(variant_keys),0) not between 1 and 100
 then raise exception 'Provide 1-100 variants, a decision, reviewer and owner-authorized basis'; end if;
 perform pg_catalog.pg_advisory_xact_lock(49170302);
 for candidate in
  select p.*,v.model_year_id from marine.catalog_projection p join marine.boat_variants v on v.id=p.variant_id
  where p.variant_id=any(variant_keys) order by p.variant_id
 loop
  if decision='publish' then
   snapshot:=marine.preview_snapshot(candidate.variant_id);
   if exists(select from marine.snapshot_sources(snapshot) claim
    where claim#>>'{license,status}' is distinct from 'approved')
   then raise exception 'All source documents must be approved for %',candidate.variant_id; end if;
   update marine.boat_models set status='published'
     where (manufacturer_slug,slug)=(candidate.manufacturer_slug,candidate.model_slug);
   update marine.boat_model_years set status='published' where id=candidate.model_year_id;
   update marine.boat_variants set status='published' where id=candidate.variant_id;
   update marine.catalog_projection set approved_snapshot=snapshot,approved_at=now(),approved_by=reviewer
    where variant_id=candidate.variant_id;
   if not exists(select from public.marine_catalog_read where variant_id=candidate.variant_id)
   then raise exception 'Release eligibility check failed for %',candidate.variant_id; end if;
  else
   update marine.boat_variants set status=case when decision='reject' then 'rejected'::marine.review_status else 'verified'::marine.review_status end
   where id=candidate.variant_id;
   update marine.catalog_projection set approved_snapshot=null,approved_at=null,approved_by=null
    where variant_id=candidate.variant_id;
  end if;
  insert into marine.catalog_review_items(variant_id,kind,details,resolved_at)
   values(candidate.variant_id,'publication_decision',pg_catalog.jsonb_build_object('decision',decision,'reviewer',reviewer,'basis',basis),now());
  decided:=decided+1;
 end loop;
 if decided<>(select count(distinct id) from unnest(variant_keys) as input(id))
 then raise exception 'Unknown variant in publication batch'; end if;
 return decided;
end $$;
revoke all on function marine.decide_source(bigint,boolean,text,date),
 marine.preview_snapshot(text),marine.decide_variants(text[],text,text,text),
 marine.edit_claims(jsonb,text,smallint,boolean) from public,anon,authenticated;
grant execute on function marine.edit_claims(jsonb,text,smallint,boolean) to anon,authenticated;

create or replace view public.marine_published_catalog with (security_barrier=true) as
select p.variant_id,p.manufacturer_slug,p.model_slug,p.category_slug,p.model_year,p.search_text,
       s.length_in,s.installed_hp,s.passengers,
       p.approved_snapshot as record_data
from marine.catalog_projection p
join marine.boat_variants v on v.id=p.variant_id
join marine.boat_model_years y on y.id=v.model_year_id
join marine.boat_models m on (m.manufacturer_slug,m.slug)=(y.manufacturer_slug,y.model_slug)
join marine.boat_specifications s on s.variant_id=v.id
where v.status='published' and y.status='published' and m.status='published'
and p.approved_snapshot is not null and marine.edit_claims(p.approved_snapshot,null,null,false) =
 marine.edit_claims(p.record_data,null,null,false)
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
