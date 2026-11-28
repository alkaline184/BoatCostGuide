# Phase 3B.2 implementation report

## Catalog and database

The local Supabase stack contains 35 model families and 50 verified US model-year variants. The catalog met the 50-variant minimum and remains 50 below the 100-variant target. Forty are model year 2027, two are 2026, four are 2025, and four are 2023.

| Manufacturer      | Variants |
| ----------------- | -------: |
| Sea-Doo           |       18 |
| Sun Tracker       |       15 |
| Kawasaki          |        7 |
| Yamaha Boats      |        5 |
| Yamaha WaveRunner |        5 |

The four repeatable offline adapters ingest checked manufacturer batches for Kawasaki, Sea-Doo, Sun Tracker and Yamaha WaveRunner. The Yamaha Boats data comes from the reviewed baseline. The current dataset has 38 current USD prices and five historical prices. The catalog includes length, weight, fuel and engine information for all 50. It includes 48 reported widths or beams, 48 numeric capacities and 34 confirmed installed-power values. All 401 stored specification observations and all 43 prices carry a source-document reference.

A clean migration and import added 50 records. The replay added and changed zero. The SQL verification checks roles, source-rights enforcement and expiration, and rolls back simulated approvals. The anonymous Data API and public BoatCostGuide search both returned zero records. No catalog observations are approved for public release.

See [setup and commands](SUPABASE-SETUP.md), [source history](DATA-PROVENANCE.md), [publication steps](PUBLICATION-POLICY.md), and [quality and scaling](MANUFACTURER-EXPANSION.md).

## Research tools

Explorer serves 24 filtered variants per page. Manufacturer and boat-type pages use the same query. The budget tool matches checked prices in the browser. Model and comparison views put source links next to verified values. The SVG library has 17 templates with side and top views, blueprint and clean styles, shared-scale comparison and overlays, and generic scale references. The storage visualizer checks the rectangular dimensions and measurements supplied by the user. The private gallery labels synthetic examples. See [marine illustrations](MARINE-ILLUSTRATIONS.md).

The catalog review and gallery run locally on port 3005. Both return 404 in production. The review dashboard reads the offline intake manifests. The public application reads the publication projection when configured. Search keeps full records off the client beyond each page, with current search filtering and sorting in the Next.js server. Moving search filters into PostgreSQL and measuring that query with larger batches remain scalability work.

## Validation and measured results

The Webpack production build, TypeScript, ESLint, formatting, 69 unit tests, 81 Playwright tests across desktop, tablet and mobile, and the local SQL verification passed. The production and review routes were checked separately.

The initial 50-row import took 160 ms and replay took 116 ms in one local run. The anonymous Supabase API returned zero rows in a 322 ms cold smoke check. The gallery contains 38 rendered SVG elements. A desktop Chrome `getBBox()` pass across the 38 took 8.7 ms. This measures geometry queries on the rendered gallery. A manufacturer-filtered SQL explain on the rights-pending database returned zero rows and short-circuited downstream joins at the variant status filter.

One mobile Lighthouse run on the production homepage recorded 48 performance, 100 accessibility, 100 SEO, LCP 3.87 seconds, CLS 0, and approximately 154 kB of transferred JavaScript. It ran while the browser suite was active. With the suite finished, a repeat recorded 95 performance, 100 accessibility, 100 SEO, LCP 2.86 seconds, CLS 0.00013, and the same JavaScript transfer. Desktop and mobile catalog view checks reported zero Axe violations in the checked model and comparison views. Real catalog detail pages were checked separately in local review because those records have no public approval.

## Remaining release work

Obtain written commercial display, indexing, and retention decisions for manufacturer sources. Identify the dedicated remote development project and apply the migration only after its private-data scope is confirmed. Publish a small rights-cleared pilot, measure a full refresh, then expand toward 100 variants. The current intake depends on human verification and no commercial API calls were made.
