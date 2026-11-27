# Architecture

- `src/app` holds prerendered routes, metadata routes and the shared layout.
- `src/config/site.ts` defines the brand, canonical origin and implemented route metadata. `src/lib/seo` builds page-specific social and search metadata.
- `src/content` defines the homepage guide and FAQ. Route-specific editorial copy lives in its route.
- `src/components/calculators` owns local interactive state. Reusable numeric fields and site layout components live alongside it.
- `src/lib/finance` models a fixed-rate amortizing loan. The calculation uses `log1p` and `expm1` for numerical stability near zero interest. `src/lib/validation` validates one authoritative down-payment unit at a time, and `src/lib/formatting` formats output to cents.
- `tests/unit` verifies formulas and edge cases. `tests/e2e` checks the production server using Chromium and axe.

Inputs live in React state and stay in the browser. Converted down-payment fields display convenient precision while retaining the unrounded conversion until edited. Blank or invalid inputs suppress the estimate. The calculator has no API route or storage backend.

Use dedicated route modules for future tools and reuse the finance engine. Future referral placements can live in server-rendered route content, outside the finance engine and input state.
