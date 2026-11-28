# TheBoatDB evaluation

## Run the local review

Use `npm run dev:boatdb` and open [Private Boat Explorer](http://127.0.0.1:3005/provider-review). The command binds the review to loopback and explicitly enables the development route. Use `THEBOATDB_API_KEY` in the ignored `.env.local` file. The local key has a live marker and authenticated successfully. The code confirms key kind without reporting the credential or its prefix.

The review provides live model-name search, power/sail filtering, bounded paging, provider detail, two- or three-model comparison, and quote-based ownership scenarios. Production windows describe provider-reported build periods. The provider reference price keeps its original currency and provenance and is excluded from USD financing. Photographs link directly to recognized provider CDN URLs with attribution. Photos can depict a series or configuration unless the provider confirms the exact variant. The integration neither mirrors assets nor stores supplier records in the catalog files.

## API contract and rights

The documented live REST origin is `https://api.theboatdb.com`, version `/v1`, with read-only bearer authentication. Boat summary and detail require the boats read scope. The manufacturer resources have a separate read scope. Lists return `data` and `pagination` with `limit`, `offset`, and `total`. Boat search is by model-name term prefix, and filters include maker slug, type, category, activity, length, and production-window overlap. Details expand dimensions, hull, tanks, engines, categories, activities and gallery. Manufacturer records can supply logos. Brochures and manuals appear in the agreement as conditional future API data and were absent from the sampled detail schema. A separate test base was unverified. The integration sends recognized live keys only to the documented live host and rejects redirects. [API overview](https://theboatdb.com/docs/api) · [Boats](https://theboatdb.com/docs/api/boats) · [Manufacturers](https://theboatdb.com/docs/api/manufacturers) · [API explorer](https://theboatdb.com/docs/api/explorer)

The API returned a 10,000-request quota and 60 requests per minute for the live key. Evaluation starts at most one request every six seconds, counts retries against its ceiling, and stops on permission errors or exhausted monthly quota. Developer review uses a small five-minute memory cache. The benchmark emits aggregate counts only and retains no response payloads. [Rate limits](https://theboatdb.com/docs/api/rate-limits) · [Pricing](https://theboatdb.com/pricing)

Terms allow a limited subscribed application display use with attribution and impose restrictions on reproducing the catalog, distributing data, caching and serving test keys. The agreement requires stopping display and disposing of stored/cached data after access ends. This integration is opted-in local development only. Obtain explicit confirmation that an indexable, commercial shopping and research experience fits the license before considering public rollout. [User Agreement](https://marinedatacloud.com/user-agreement)

## Reproduce

- `npm run catalog:theboatdb -- --connectivity` checks DNS, TLS, the public version descriptor and one authenticated list.
- `npm run catalog:theboatdb` samples maker namespaces and compares manufacturer-sourced targets with bounded provider lists. The request ceiling is configurable downward with `THEBOATDB_EVALUATION_LIMIT`, capped at 250. Run the evaluation and preview sequentially when pacing against the same live key.
- Target identities and original manufacturer URLs are in `scripts/marine/benchmark-targets.ts`. Candidate names and potentially overlapping periods are reported separately from validated US model-year matches.

## Live results

On November 27, 2026, DNS, TLS and bearer authentication succeeded. The version descriptor identified v1. The first benchmark list returned HTTP 200 JSON in approximately 3.29 seconds and included the documented pagination and quota headers. The main benchmark consumed 50 authenticated GETs, all successful, with 9,946 of 10,000 requests remaining at its end. Separate connectivity probes consumed four authenticated requests.

| Catalog filter | Provider count |
| -------------- | -------------: |
| All boats      |          6,476 |
| Manufacturers  |            707 |
| Power type     |          4,908 |
| Sail type      |          1,419 |

Power and sail are provider type filters. Their sum leaves 149 records in other or unreported types. The API has no documented country filter and the sampled response lacked a US market field.

| Target manufacturer | Provider records |
| ------------------- | ---------------: |
| Sea Doo             |               24 |
| Yamaha WaveRunner   |               23 |
| Kawasaki            |                5 |
| Yamaha Boats        |               45 |
| Scarab              |                6 |
| Sun Tracker         |               15 |
| Bennington          |               77 |
| Mastercraft         |               22 |
| Malibu Boats        |               18 |
| Boston Whaler       |               41 |
| Sea Ray             |               85 |
| Grady-White         |               30 |
| Tracker Boats       |               26 |
| Bayliner            |               31 |
| Chaparral Boats     |               44 |
| Regal Boats         |               39 |

The targeted searches resolved a single matching manufacturer for each requested make and verified separate Yamaha Boats and Yamaha WaveRunner identifiers. The searches were bounded by name and cannot rule out unused aliases or duplicate manufacturers elsewhere.

The main sample included 127 unique summary records, with one usable provider photo URL in each, two missing production starts, zero missing overall lengths and 16 missing reference prices. Observed price currencies were USD and EUR. Of 15 targeted detail records, eight had multiple recognized photo URLs, six lacked beam and all 15 lacked draft and numeric engine power in their mapped fields. These counts describe the targeted sample. Detail may label a model-series photograph or have source-supplied notice text. Budget calculations require a user quote.

### Recommendation

Use TheBoatDB as a supplementary discovery and photography source under the applicable license. Keep independent US manufacturer verification as the source of exact market, model year, engine, package and baseline pricing. The provider has broad make coverage but the sample found gaps and ambiguous production periods in the exact configurations required for public comparisons. Do not rank or filter by a provider reference price as if it were a US transaction, asking price or current MSRP.

### Benchmark by target

| Independent 2027 US shortlist | Targets | Name plus overlapping provider window | Ambiguous overlap |
| ----------------------------- | ------: | ------------------------------------: | ----------------: |
| Sea-Doo PWC                   |      10 |                                     4 |                 0 |
| Yamaha WaveRunner             |      10 |                                     6 |                 0 |
| Kawasaki                      |       5 |                                     1 |                 0 |
| Yamaha Boats                  |      10 |                                     6 |                 0 |
| Sea-Doo Switch                |       5 |                                     1 |                 0 |
| Sun Tracker                   |      10 |                                     7 |                 4 |
| Total                         |      50 |                                    25 |                 4 |

The exact-match rule uses a normalized model name or model plus version. Candidate windows can be open-ended. These two signals alone confirmed zero exact US model-year variants. Kawasaki names were reconciled against the official US release, and the retest retained one candidate. The additional Bennington check matched all five OEM floorplan names. Its US floorplan source supplied layout names, with US model year unverified, so these five are outside the 50-target year comparison.

The targeted follow-up consumed 17 authenticated requests, all successful, and ended with 9,929 remaining. It returned 56 records under the PWC activity, 589 in the pontoon category, and 57 in the waterjet category. These filters can overlap and do not establish market. The newest production start observed in this sample was 2027. Source labels such as waterjet can include tenders as well as recreational jet boats.

The completion audit adds field-level and photography verification, pricing, and licensing conclusions in [TheBoatDB completion audit](THEBOATDB-COMPLETION.md).
