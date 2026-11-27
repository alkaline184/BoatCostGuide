# BoatCostGuide development guide

## Product and brand

- Build free, independent boating financial planning tools for US buyers and owners. Use USD and US English.
- The brand is BoatCostGuide. The canonical origin is https://boatcostguide.com. Alternate domains belong in deployment configuration and documentation.
- Preserve the marine palette, wordmark and calculator-first hierarchy. Publish examples as illustrations and use attributable evidence for market claims.

## Architecture

- Keep route content and metadata server-rendered by default. Reserve client components for interactive features.
- Keep finance functions deterministic and independent of React, validation shared, and formatting at the display boundary.
- Phase 1 runs without credentials, accounts, a database, external data, tracking or referral integrations.

## Financial standards

- State assumptions, units, rounding and exclusions near results and in methodology. Use nominal interest rate for the payment input.
- Keep full calculation precision until display. Cover zero interest, cash purchase, invalid input and independently verified expected values.
- Treat payment cash flow and total economic ownership cost as distinct measures. Account for charges only where the model or an explicit user input includes them.

## SEO and accessibility

- Maintain unique page metadata, canonical URLs and sitemap entries through the site configuration. Index only complete public routes and keep previews out of search.
- Ensure semantic HTML, visible focus, keyboard operation and understandable form errors. Test responsive layouts and verify the server renders educational content.

## Testing and Git

- Use npm and keep the lockfile in Git. Run format checks, lint, strict type checking, Vitest, a production build and Playwright before review.
- Use a focused feature branch off main and meaningful commits. Preserve user changes and history. Deploy and merge only when authorized.
