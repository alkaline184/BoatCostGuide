# Architecture

- `src/app` holds prerendered routes, metadata routes and the shared layout.
- `src/config/site.ts` defines the brand, canonical origin and implemented route metadata. `src/lib/seo` builds page-specific social and search metadata.
- `src/content` defines the homepage guide and FAQ. Route-specific editorial copy lives in its route.
- `src/components/calculators` owns local interactive state. Reusable numeric fields and site layout components live alongside it.
- `src/lib/finance` models a fixed-rate amortizing loan. The calculation uses `log1p` and `expm1` for numerical stability near zero interest. `src/lib/validation` validates one authoritative down-payment unit at a time, and `src/lib/formatting` formats output to cents.
- `tests/unit` verifies formulas and edge cases. `tests/e2e` checks the production server using Chromium and axe.

Inputs live in React state and stay in the browser. Converted down-payment fields display convenient precision while retaining the unrounded conversion until edited. Blank or invalid inputs suppress the estimate. The calculator has no API route or storage backend.

Use dedicated route modules for future tools and reuse the finance engine. Future referral placements can live in server-rendered route content, outside the finance engine and input state.

## Dedicated calculators

The four calculator routes prerender page content and hydrate route-specific inputs. The shared loan module provides payment factors, fixed schedules and prospective balances. Purchase, affordability, ownership and payoff models apply their own constraints using those primitives. Shared UI handles numeric entry, responsive results, textual chart alternatives, annual and paginated monthly schedules, and local CSV exports.

Transfers use a single in-memory slot addressed to the destination route. The destination imports only its supported numeric fields and runs its validators before presenting results. Reloading clears values. A loan-to-ownership transfer shares price, down payment, charges and rate/term. Ownership uses its own upfront charge policy and does not carry trade-in equity or financed charge treatment.

Phase 2 starts from merged main commit `e3ca814`, which includes Phase 1 PR #1.

Phase 3A starts from `daf39f6` on main, which includes Phase 2 PR #2. Its production homepage uses a static editorial category list. Development-only model and comparison components consume the provider-independent contract. See [marine architecture](MARINE-ARCHITECTURE.md) for schema and publication gates.
