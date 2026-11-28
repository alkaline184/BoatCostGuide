# TheBoatDB completion audit and commercial decision

## Decision

Do not buy the €99/year Pro subscription for BoatCostGuide at this stage. Reconsider a narrowly scoped photography and discovery license after written confirmation of indexed, affiliate-supported pages and an OEM-linked photo pilot reaches the image target. The live API is technically usable. Exact US variant coverage and provider reference pricing fall far short of the shopping requirements. [Published plans](https://theboatdb.com/pricing)

| Use                    | Recommendation                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog discovery      | Supplementary candidate discovery. Match maker, variant and exact model year against the US manufacturer before publication.                                 |
| Photos                 | Supplementary, with human image review and written rights for each publication workflow. Keep category illustrations for unmatched variants.                 |
| Technical specs        | Use as leads and independent cross-check candidates. Confirm source units, exact configuration and weight definition. Quarantine suspect dimensions.         |
| Pricing                | Enrich from the manufacturer's dated US pricing separately. Provider USD references have indicative basis and may differ materially from exact US base MSRP. |
| Historical information | Use production windows for navigation and archive research. Verify an exact model year with OEM publications before presenting it as a US variant.           |
| Production deployment  | Keep provider data and evaluation private. Reassess after licensing confirmation and variant-level QA.                                                       |

## Method and reproducibility

The original 50 US targets remain unchanged. The audit matches normalized model name or model plus version within the provider maker. A production-window overlap is an approximate match, and multiple candidate records remain ambiguous. A uniquely named record can still describe a different market or generation. The data-quality dashboard lists every target, candidate ID and provider detail link, year confidence, photo metadata and review status, referenced price, and field-level OEM checks.

Run `npm run catalog:theboatdb-complete` followed by `npm run catalog:theboatdb-verify-fields` while request budget remains, then `npm run catalog:theboatdb-photos` and open [the private dashboard](http://127.0.0.1:3005/provider-review/quality) under `npm run dev:boatdb`. The bounded audit retains derived review observations and links in ignored, local files. It uses the configured key without logging it, keeps a request ledger and uses six-second pacing. The dashboard reads the audit without spending requests. Opening a provider detail link uses the existing live review integration. Browser screenshots and the contact sheet stay in the ignored evaluation directory.

### Spec and price denominators

The seven core fields are length, beam, dry weight, installed horsepower, engine count, passenger capacity and fuel capacity. Missing is absent from the mapped provider observation. Comparable observations require a unique candidate, an OEM baseline from the same reported start year as the provider candidate, verified units and a comparable official value. This is a numeric cross-check on candidates, with exact US identity still open. Dry weight cannot be verified from displacement or unqualified weight. Untyped volume is ambiguous. Tolerances are 1 in for length and beam, 5 lb for an agreed dry-weight basis, 1 hp for rated installed power, 0.25 US gal for comparable capacity, and exact installed engine and passenger counts.

Match-level completeness uses populated fields over candidate records × seven. Target-level completeness uses 50 × seven, credits at most one set of fields per target, and shows the best observed completeness for ambiguous targets. Accuracy uses correct divided by comparable observations. Missing and ambiguous observations are reported separately. A USD reference observation can be compared numerically to an OEM value when available, but its reference basis cannot establish US MSRP. Prices without year, market, basis and date confidence are unusable for MSRP and financing defaults.

### Composition method

Use documented filters and pagination totals for catalogue, type, activity, categories and overlapping production windows. The mixed sample intentionally covers the first and middle pages of five cohorts, a recent-overlap page, and five spread positions ordered by manufacturer. Counts describe sampled rows; the sample is stratified for coverage and is unweighted. It cannot support catalog-wide photo, price or manufacturer-by-category totals. Manufacturer ranking is limited to the targeted US-relevant maker search and recent record counts. Overlap can include much older open-ended records. [Boats API filters](https://theboatdb.com/docs/api/boats) · [Manufacturer API](https://theboatdb.com/docs/api/manufacturers)

## Independent manufacturer enrichment

Ten US configurations cover Sea-Doo, Yamaha Boats and Kawasaki. All ten have published USD figures with their original basis. Six 2027 Sea-Doo/Yamaha price observations are starting prices, three 2027 Kawasaki observations are base MSRP, and the 2025 GTX 170 is an archived starting price. All ten have an official length, beam, dry weight or estimated dry weight, and fuel capacity. The 275SD's yacht certification does not establish a numeric seating limit. The dashboard carries the source links and the independent observations are held apart from provider data. [Sea-Doo US lineup](https://sea-doo.brp.com/us/en/models.html) · [Yamaha build and price](https://www.yamahaboats.com/build-and-price/) · [Kawasaki STX 160 line](https://www.kawasaki.com/en-us/watercraft/jet-ski/sit-down/jet-ski-stx-160)

Rechecking the ten already identified official configurations took about 13 elapsed seconds of batched browser-source queries. This measures source retrieval and spot checks on a prepared list, with familiar sources and earlier research available. Fresh cataloging needs identity verification, unit and basis review, source date capture, second checking and handling exceptions. For planning, budget 5–12 minutes of initial review plus 2–4 minutes of QA per model after templates and sources are established.

| Target catalog size | Estimated editorial hours at 7–16 minutes per model |
| ------------------- | --------------------------------------------------: |
| 100 models          |                                               12–27 |
| 500 models          |                                              58–133 |
| 1,000 models        |                                             117–267 |

The estimates exclude source and asset licensing turnaround, photo sourcing, difficult archived trims, and ongoing refresh. Build to 100 with the original brands and a written publishing policy. Expand in manufacturer/model-year batches, keep citations and observations per field, and require two reviews for unit, trim and pricing conflicts. At 500–1,000, automate schema checks, unit conversion, provenance and stale-price flags. Allocate separate photo review and permission tracking, preserve product-family links, and publish only verified, rights-cleared models with an attributed model photo or clearly labeled illustration.

## VehDB

The approved local environment contained no `VEHDB_API_KEY`. No authenticated VehDB requests were made. Combining the providers remains unmeasured. Compare independently verified US variants with both providers when a permitted test credential is available; do not infer that combining two incomplete feeds meets the release thresholds.

## Licensing questions

The User Agreement grants a limited, revocable application-display license with an active subscription that includes API access. It restricts standalone data products, sharing or exporting caches, bulk copying or rehosting, competing databases/services, and test-key use for end users. It requires attribution and stopping display when the license ends. Cached or stored provider data must be deleted within 30 days after the license ends, subject to legal retention requirements. [User Agreement, API Data and Business Use](https://marinedatacloud.com/user-agreement)

| Workflow                                       | Agreement reading and written confirmation needed                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public commercial research and affiliate links | An active subscription provides a limited in-app business-use grant. Ask whether a public consumer research and affiliate-supported comparison site is permitted given competing-service and catalogue reproduction restrictions. |
| Search indexing and static rendering           | The agreement has no explicit grant for indexing, search engine reproduction or persistent prerendered HTML. Confirm bot access, sitemap, HTML caching and purge deadlines.                                                       |
| Side-by-side comparisons                       | In-app serving is generally described. Confirm scope for multi-record public comparison pages, derived metrics, and share URLs.                                                                                                   |
| Provider-hosted photos and OEM specs           | Display by linking to supplied image URLs or caching files for that display is explicit. Confirm mixed-source presentation, asset-level sublicensing and photo notices.                                                           |
| Local caching and image optimization           | Cache only for serving the application. Confirm TTL, CDN image resizing, optimization derivatives, and source removal handling. Avoid bulk mirroring.                                                                             |
| Financial calculations                         | Own inputs and results computed from own data are distinguished in the agreement. Confirm any display or derived calculation that incorporates provider fields or prices.                                                         |
| Cancellation and retention                     | Stop provider display at license end and delete stored or cached API data within 30 days, subject to legal retention requirements. Confirm cleanup of static pages, search caches, backups and derivatives.                       |

Confirm protections against third-party asset claims, asset takedown/revocation, rights per plan, and retention of aggregate audit findings. No subscription purchase or public publication is part of this evaluation.

## Results

### Catalog composition and target makers

The API returned 6,476 records across 707 manufacturers. Power (4,908) and sail (1,419) leave 149 records in other or unreported types. PWC activity (56), pontoon category (589), and waterjet category (57) are separate filters that can overlap the type counts. The waterjet category includes tenders and is a proxy for jet boats. The API returned 6,222 records overlapping 2020–2027. The latest production start observed was 2027; the API exposes window overlap and the audit does not establish the maximum start date across the entire catalog.

| Year overlapping a provider production window |  2020 |  2021 |  2022 |  2023 |  2024 |  2025 |  2026 |  2027 |
| --------------------------------------------- | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ----: |
| Records                                       | 3,064 | 3,771 | 4,983 | 5,618 | 5,758 | 5,906 | 6,108 | 6,195 |

| Cohort            | Unique sample | Manufacturers observed | Newest start observed |
| ----------------- | ------------: | ---------------------: | --------------------: |
| Power type        |            59 |                     35 |                  2023 |
| Sail type         |            60 |                     20 |                  2024 |
| PWC activity      |            42 |                      4 |                  2026 |
| Pontoon category  |            60 |                     10 |                  2027 |
| Waterjet category |            43 |                      4 |                  2026 |
| Recent overlap    |            29 |                     19 |                  2023 |

The 20 strongest among 21 resolved US-relevant makes by recent-overlap record count were Lowe Boats (101), Sea Ray (85), Bennington (77), Ranger Boats (60), Yamaha Boats (45), Chaparral Boats (42), Boston Whaler (41), Regal Boats (39), Bayliner (31), Cobalt Boats (31), Grady-White (30), Tracker Boats (26), Sea Doo (24), Yamaha WaveRunner (23), Mastercraft (22), Robalo Boats (22), Malibu Boats (18), Sun Tracker (15), Nautique (10), and Scarab (6). Kawasaki had five. Rankings describe the bounded target-maker query and include older, open-ended records. The dashboard also shows each maker’s all-year total.

Of 406 unique sample records, 403 had a recognized primary photo URL and 268 had a reference price. There were 30 USD, 237 EUR and one other currency reference. Catalog-wide photo, price and maker-by-category totals were unavailable through the documented filters. Six malformed summary-row observations were excluded from the sample and remain counted in the dashboard.

### Benchmark and photography

| Outcome                                          | All targets |          Matched subset |
| ------------------------------------------------ | ----------: | ----------------------: |
| Exact US identity                                |        0/50 |  0/29 candidate records |
| One approximate candidate                        |       21/50 |   21/25 matched targets |
| Ambiguous                                        |        4/50 |    4/25 matched targets |
| Missing                                          |       25/50 |                       — |
| Primary image metadata                           |       25/50 | 29/29 candidate records |
| Gallery metadata                                 |       17/50 | 20/29 candidate records |
| Usable primary resolution in browser             |       24/50 | 24/25 inspected targets |
| Passes resolution, conflict and watermark checks |       22/50 | 22/25 inspected targets |
| Identifiable named candidate image               |        5/50 |  5/25 inspected targets |
| Identifiable exact 2027 variant image            |        0/50 |  0/25 inspected targets |

The Chrome audit rendered one primary image per matched target from the supplied CDN. All 25 loaded, 24 met the 640 × 360 threshold, 16 had gallery metadata, and exact rendered duplicates were 0/25. Natural widths ranged from 600 to 2,000 pixels. One had alt text and none carried an explicit credit field in the checked API image shape. One showed a visible third-party dealer watermark. Studio photos dominated, with several lifestyle, storage-yard and dealer-lot shots. An identifiable candidate image can still be from a different model year. In one concrete conflict, the primary photo of an SX220 record shows an AR220 hull decal. Image assets need review, even when the provider link loads. See the private contact sheet and the dashboard for individual results. [Yamaha SX220](https://www.yamahaboats.com/boats/categories/22-ft-boats/SX220/) · [Yamaha 22-foot lineup](https://www.yamahaboats.com/boats/categories/22-ft-boats/)

### Specifications and pricing

The benchmark price denominator is 50 targets and 29 matched candidate records. Twenty-three targets had any price (46%), and five had a USD reference (10%). Records had 24 indicative prices out of 29, including 19 EUR and five USD. Five lacked a price. No candidate had a verifiable provider-reported US MSRP or a dated price. The five USD references numerically agreed with archived OEM starting prices/base MSRP for their reported start years (2025–2026). They apply to older price baselines and remain reference observations. There were zero usable current 2027 US MSRP observations from the provider. [Archived GTX](https://sea-doo.brp.com/us/en/models/previous-models/2025/gtx.html) · [Archived GTI](https://sea-doo.brp.com/us/en/models/previous-models/2025/gti.html) · [Archived GTR](https://sea-doo.brp.com/us/en/models/previous-models/2025/gtr.html) · [Archived Switch](https://sea-doo.brp.com/us/en/models/previous-models/2025/switch.html) · [Archived Kawasaki STX 160X](https://www.kawasaki.com/en-us/watercraft/jet-ski/sit-down/jet-ski-stx-160/2026-jet-ski-stx-160x)

The 2025 GTX 170 API summary and detail both returned a normalized 41.422 m. The raw API record declared imperial and returned length 135.9 and beam 49.2. The OEM sheet records these as inches, approximately 3.451 m and 1.25 m. Interpreting the numeric inches as feet produces the provider’s 41.42 m and 15 m public display. BoatCostGuide receives the wrong normalized length from the provider; the public page shows the same error. The evidence locates the conflict upstream of our adapter. It does not distinguish an upstream ingestion error from missing field-level unit labeling. The audit preserves the values and does not implement a guessed correction. [OEM spec sheet](https://sea-doo.brp.com/content/dam/global/en/sea-doo/my25/documents/specs-sheets/na/en/SEA-MY25-TOUR-GTX-SPEC-ENNA-Page-PDFx.pdf) · [Provider public record](https://theboatdb.com/boat/sea-doo-gtx-170-2025)

The 29 candidates provided 106 populated core observations out of 203 (52.2%). There were 97 missing or unavailable. The best available candidate per target yielded 97 of 350 fields (27.7%). Of the populated fields, 45 were independently comparable against exact-year manufacturer publications for the provider's reported start year. The checks found 23 correct, 22 incorrect, and 61 ambiguous or unchecked. Numeric agreement was 51.1% (23/45). The older candidate baselines do not change exact 2027 coverage. [2023 Yamaha US boat brochure](https://www.yamahaboats.com/globalassets/z-old/_boats/all-boats/2023boatbrochure2.pdf) · [2023 Yamaha WaveRunner brochure](https://www.yamahawaverunners.com/globalassets/z-old/_waverunners/all-waverunners/2023waverunnerbrochure2.pdf)

| Core field         | Populated / 29 candidate records |
| ------------------ | -------------------------------: |
| Length             |                               29 |
| Beam               |                               12 |
| Dry weight         |                                0 |
| Rated horsepower   |                               13 |
| Engine count       |                               29 |
| Passenger capacity |                                0 |
| Fuel capacity      |                               23 |

The budget allowed an expanded raw-field check for 26 of 29 candidates. Typed numeric strings supplied the horsepower values. Only one populated fuel observation carried an unambiguous unit; the other fuel values remain unverified. The three candidates whose expanded fields were unchecked contribute to the reported lower bound. The API's displacement field remains separate from dry weight.

### Release thresholds

| Requirement                                             | Evidence                                                                                                                                | Decision                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 90% exact target coverage                               | 0/50 confirmed. 25/50 approximate or ambiguous.                                                                                         | Miss                                            |
| 90% usable model photography                            | 24/25 decode at sufficient resolution. 22/25 pass resolution, conflict and watermark checks. Five named candidate models identifiable.  | Miss for model-specific publication             |
| 95% core spec completeness                              | 106/203 candidate fields populated.                                                                                                     | Miss                                            |
| 98% independently verified spec accuracy                | 23/45 numeric agreements.                                                                                                               | Miss                                            |
| 80% usable US pricing or validated independent strategy | 0/50 current provider MSRP. OEM pilot found a stated USD basis for all ten, including nine current observations.                        | Use OEM enrichment and validate at larger scale |
| Acceptable recent US model coverage                     | Production windows overlap 2027 for 6,195 records; US exact variant coverage remains unproven.                                          | Miss                                            |
| Sustainable quota                                       | 150 authenticated requests returned HTTP success. 9,775 of 10,000 remained; paced at ten per minute against the server’s 60 per minute. | Pass for scoped evaluation                      |
| Suitable commercial publication rights                  | Limited display grant, with important indexing, affiliate use and static rendering questions open.                                      | Pending                                         |

The cap included three successful connectivity requests from the first run, which stopped during application parsing, 117 requests in the main run, four targeted shape probes, and 26 expanded-field checks. Quota was sufficient for the evaluation. At larger scale, 1,000 single-detail lookups each week would consume about 4,000 monthly requests before misses, refresh retries or interactive traffic. Daily refresh of that scale would exceed the observed allowance. Keep independent verified records and use any permitted provider lookup selectively.

## Validation

The production build, formatting, lint, strict types, and 69 unit tests passed. The full Chrome suite passed 78 tests with one worker and all original assertions intact. The previously reported intermittent failure was a Chrome context-creation timeout. It did not recur in this run. The live dashboard passed desktop and mobile layout, noindex, candidate-link, 50-row, and automated accessibility checks. The credential, sampled provider ID and private audit artifacts were absent from the production output scan. Both the explorer and quality routes remain unavailable in production and ordinary development without the explicit loopback opt-in.
