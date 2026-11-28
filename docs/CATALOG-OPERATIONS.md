# Catalog operations

## Acquire and refresh

The network is disabled for the currently registered manufacturers. Operators may process authorized, locally supplied documents or use the checked editorial JSON format. The supported document profiles are Kawasaki US spec-sheet text and Sun Tracker US product specification text. The adapters confirm year, family and trim against the document header, require known labels, preserve units and reject conflicting rows. They accept extracted text, or text-bearing PDF files with Poppler's `pdftotext` installed. Layout changes, scanned pages, and unmatched packages require editorial intake. No manufacturer feed is configured.

```sh
npm run catalog:refresh -- discover --manufacturer=yamaha-boats
npm run catalog:refresh -- stale --manufacturer=sea-doo
npm run catalog:refresh -- document /private/specification.txt /private/profile.json
npm run catalog:refresh -- compare /private/batch.json --manufacturer=kawasaki --model='Jet Ski STX 160'
npm run --silent catalog:refresh -- compare /private/batch.json --approve='kawasaki/jet-ski-stx-160/2027/160x' --emit-sql > /private/approved-intake.sql
```

A document profile supplies the adapter key, observation date, exact US identity, exact manufacturer source and year URLs, confirmed engine configuration, intended use, and editorial comment. Example profile structure is in `tests/unit/catalog-document-adapters.test.ts`. Prices are optional. Missing acquisition files and parser failures exit before writing anything. Compare outputs unchanged, new family, new model year, new variant, price, specification correction or conflict, and source change proposals. A missing offer or field is a review signal. A partial proposal cannot overwrite an existing observation until a reviewer reconciles the missing fields. Archival requires an explicit decision. Record which input was unavailable in the intake log when a document cannot be obtained.

All refresh commands are read-only until an operator selects exact identities and applies explicitly emitted SQL to an authorized storage environment. Applying intake updates a private verified candidate and adds history. It does not grant publication rights. Apply using `psql -v ON_ERROR_STOP=1 -f` or the authorized Supabase Management SQL editor. Keep job output private and redact filesystem paths in operational exports.

## Publication

Use a privileged database session and approved owner-supplied references. Query candidate sources, exact snapshot, and pending observations before making a decision.

```sql
select id, manufacturer_slug, model_year, url, approval_reference, expires_on
from marine.source_documents where manufacturer_slug = 'kawasaki';

select variant_id, kind, created_at from marine.catalog_review_items
where resolved_at is null order by created_at desc;

select marine.preview_snapshot('<variant-id>');
select marine.decide_source(<source-id>, true, '<owner-authorized rights reference>', null);
select marine.decide_variants(array['<variant-id>'], 'publish', '<reviewer>', '<editorial approval reference>');
select marine.decide_variants(array['<variant-id>'], 'reject', '<reviewer>', '<review reference>');
select marine.decide_variants(array['<variant-id>'], 'unpublish', '<reviewer>', '<withdrawal reference>');
select marine.decide_source(<source-id>, false, '<revocation reference>');
```

Publication requires exact snapshot approval and current rights on every source. Use an explicit `begin` and `commit` to associate source and variant decisions. A changed candidate invalidates approval. Search, model lookups and sitemap rebuild from live rights without a static catalog fallback.

## Source policy decisions

| Source            | Automated network retrieval | Manual factual review                      | Remote storage | Factual display | Search indexing | Images   |
| ----------------- | --------------------------- | ------------------------------------------ | -------------- | --------------- | --------------- | -------- |
| Sea-Doo           | Disabled                    | Exact US archives and model specifications | Pending        | Pending         | Pending         | Excluded |
| Yamaha Boats      | Disabled                    | Exact US catalog and year-specific PDF     | Pending        | Pending         | Pending         | Excluded |
| Yamaha WaveRunner | Disabled                    | US product and archive tables              | Pending        | Pending         | Pending         | Excluded |
| Kawasaki          | Disabled                    | Year-specific US sheet                     | Pending        | Pending         | Pending         | Excluded |
| Sun Tracker       | Disabled                    | Exact-year US detail and national package  | Pending        | Pending         | Pending         | Excluded |
| Tracker           | Disabled                    | US evidence discovery only                 | Pending        | Pending         | Pending         | Excluded |
| Scarab            | Disabled                    | Exact US trim and price review pending     | Pending        | Pending         | Pending         | Excluded |

Request written feed or document delivery permission, a storage term, display rights, indexing rights, and separate media terms. Existing official terms and evidence links are tracked in the manufacturer research report. [Manufacturer research](MANUFACTURER-EXPANSION.md)

The pull request base is `feature/phase-3b2-independent-marine-platform` at `7f9b7f6`. Phase 3B.3 preserves the separate TheBoatDB evaluation branch.
