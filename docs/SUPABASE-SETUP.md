# Supabase catalog setup

Use Docker and the Supabase CLI from this checkout. The project identifier is `boatcostguide-marine`. Local Data API and PostgreSQL ports are 55421 and 55422.

```sh
supabase start
supabase migration up --local
npm run catalog:database
npm run --silent catalog:database -- --emit-sql |
  docker exec -i supabase_db_boatcostguide-marine psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres
docker exec -i supabase_db_boatcostguide-marine psql -X -U postgres -d postgres < supabase/verify-catalog.sql
npm run dev:catalog -- --webpack
```

The first import command validates and reports the scope. The versioned approved snapshot is included when populated, but its rows still require database publication approval. The second emits one transaction for an explicitly selected destination. Add `--manufacturer=sea-doo`, `--year=2027`, or `--url=<official variant URL>` to narrow the import. The verification script creates temporary publication approvals inside a rolled-back transaction. Use it on a freshly seeded local database.

Set `BOATCOSTGUIDE_SUPABASE_URL` and `BOATCOSTGUIDE_SUPABASE_PUBLISHABLE_KEY` in the untracked local environment to connect the application’s public read path. Use the publishable or legacy anon key from the same project. Keep management credentials outside the Next.js environment. When both settings are absent the app reads the versioned approved snapshot. A partial configuration, API failure, or invalid response yields an empty public model catalog.

For remote development the owner needs to identify the dedicated project, confirm data residency and retention terms for private manufacturer observations, and provide the project URL and publishable key. A maintainer with database privileges can then apply the checked migration using `supabase link --project-ref <development-ref>` and `supabase db push`. Review source permissions before importing any private data remotely. The existing remote project was left untouched during this phase.

The local review runs at [catalog review](http://127.0.0.1:3005/catalog-review) and [marine illustration gallery](http://127.0.0.1:3005/research-preview/illustrations).
