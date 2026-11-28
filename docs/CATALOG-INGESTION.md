# Catalog ingestion

The repository uses a small, reviewed static catalog. `catalog/review.json` stores independently transcribed factual observations and original buying notes for local review. `catalog/approved.json` holds normalized, rights-cleared shopping records. Keep credentials, supplier exports, copied marketing, images awaiting clearance, and agreements in authorized private storage.

1. Identify the exact US model, model year and configuration using a manufacturer publication or an evaluation-access source.
2. Record field-level source URLs, dates, units and basis, particularly for length, dry weight and price. Record exclusions and explicit unknowns. An engine rating on a configuration sheet and a hull's horsepower limit describe different things.
3. Cross-check promotional numbers against the matching spec sheet and starting price. Leave conflicting values blank and describe the conflict in the review. Use independently written intended-use and buying notes.
4. Run `npm run catalog:validate` and `npm run catalog:quality`. Run `npm run catalog:diff -- previous.json catalog/review.json` against the previous snapshot. Inspect each new identity and every changed field.
5. Verify editorial completeness and document permission for commercial display, indexing, persistent retention, and image rights when applicable. Normalize proposals with `normalizeReviewRow` or the equivalent typed contracts. Attach source-level approval with an expiration, attribution and applicable restrictions.
6. Add approved records to `catalog/approved.json` and run validation, unit tests, build and browser tests. Inspect the sitemap and rendered pages. Refresh starting prices within 180 days. Stale prices are ineligible for display or price-based filtering while eligible specs remain visible.

## Licensed provider evaluation

Run `npm run catalog:vehdb` with `VEHDB_API_KEY` in the environment or an ignored local env file. It queries at most one page per target make, reports aggregate coverage and matching diagnostics, stops on auth or quota failure, and avoids printing response bodies or credentials. Save aggregate results privately and repeat the same sample after a provider release to assess update behavior. Treat a single snapshot as evidence about that sample only. Inspect confirmed trim mappings and field units before reporting cross-check accuracy. Any production import requires a suitable contract and revocation/refresh handling.

## Expansion

Start with priced recreational PWC from Kawasaki and Yamaha and entry-level pontoons with a confirmed engine package from Sun Tracker and Bennington. Add Scarab and archived jet boats where exact configurations and price bases are available. Seek written rights in parallel. Grow toward 100–150 useful variants by filling price bands and meaningful cross-brand comparisons before adding more trim permutations.

## Manufacturer batch intake

Enter independently verified facts from permitted documents into `catalog/manufacturers/<brand>.json`, retaining the literal measurement value and unit, exact year evidence, source and price basis. The source registry identifies official hosts and restrictions. Consistent US layouts can be imported across a batch after editorial review. The importer makes zero network requests.

Run `npm run catalog:intake` for rejection reasons, duplicates, conflicting values, coverage, staleness and timing. Run `npm run --silent catalog:intake -- --proposal > /tmp/boat-catalog-proposal.json` for a normalized additions-only review proposal. This file is an input to the review workflow. Promote a record by mapping the reviewed row with the existing normalizer and recording the required approval for every source before adding it to the approved artifact. The intake itself never modifies that artifact.

Use `npm run dev:catalog` and open the [private catalog review](http://127.0.0.1:3005/catalog-review). The production server has no intake route contents and does not consume the batch files. See [results and scale estimates](MANUFACTURER-EXPANSION.md) and the [media manifest](MANUFACTURER-MEDIA.md).
