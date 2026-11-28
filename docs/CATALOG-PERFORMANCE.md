# Catalog query performance

Measured in a disposable PostgreSQL database with transactional synthetic fixtures. The script loads the version-controlled schema, generates independent fictional records and source claims, analyzes table statistics, measures queries as `anon`, and rolls back. It refuses to run outside `boatcostguide_catalog_benchmark`. None of the fixtures were sent to the hosted database.

| Variants | Filtered matches | Search, count and page | Family lookup | Three-ID lookup | Search JSON |
| -------: | ---------------: | ---------------------: | ------------: | --------------: | ----------: |
|      100 |               31 |                23.9 ms |       1.28 ms |         0.61 ms |     3,765 B |
|    1,000 |              401 |                45.1 ms |       0.87 ms |         0.52 ms |    12,794 B |
|    5,000 |            2,081 |               110.6 ms |       0.33 ms |         0.22 ms |    12,795 B |
|   10,000 |            4,161 |               245.7 ms |       0.29 ms |         0.16 ms |    12,796 B |

Search is one RPC per result page, including exact matches, numeric filters, price sort and pagination. Initial search controls issue a separate facet query. Model lookup and comparison detail are each a single bounded request. The suggested comparison list is a separate compact search page. Homepage cards use three parallel, category-scoped results. Sitemap selects route identities instead of research JSON. Serialized bytes above omit HTTP framing. Budget mode includes an extra compact price array so that earnings and budget entries remain in the browser.

The search benchmark matches a deliberately common token and combines category, minimum price and horsepower with exact count and page two. The family and comparison figures come from separate `EXPLAIN ANALYZE` plans. Short and partial model identifiers favor trigram matching. The query checks all normalized tokens as literal substrings and applies manufacturer/year/category B-tree filters. Full-text search remains a future option for editorial prose. Trigrams suit partial model names and punctuation more closely than stemming. Materialized source identities and live rights joins keep revocation effective without re-parsing every public snapshot. Disabling nested loops and JIT for the broad search RPC removed a measured multi-second plan. These timings describe this local workload and single-run timings will vary.

```sh
createdb boatcostguide_catalog_benchmark
cat supabase/migrations/*.sql | psql -X -v ON_ERROR_STOP=1 -d boatcostguide_catalog_benchmark
for size in 100 1000 5000 10000; do
  psql -X -v "size=$size" -d boatcostguide_catalog_benchmark < supabase/benchmark-catalog.sql
done
```

Use a PostgreSQL instance with Supabase roles installed. The smallest fixture also checks anonymous permissions, unpublished results, explicit approval, source revocation and price refresh replay.
