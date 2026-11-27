# BoatCostGuide development guide

## Product and brand

- Build independent boat research and free ownership planning tools for US buyers and owners. Use USD and US English.
- The brand is BoatCostGuide. The canonical origin is https://boatcostguide.com. Alternate domains belong in deployment configuration and documentation.
- Preserve the marine palette, wordmark and discovery-first homepage hierarchy. Publish examples as illustrations and use attributable evidence for market claims.

## Architecture

- Keep route content and metadata server-rendered by default. Reserve client components for interactive features.
- Keep scenario transfers explicit, client-only and ephemeral. Validate specific inputs in the receiving tool.
- Keep finance functions deterministic and independent of React, validation shared, and formatting at the display boundary.
- The application runs without credentials, accounts, a database, external data, tracking or referral integrations.

- Keep commercial boat data and model photography behind explicit, recorded publication rights. Leave unverified catalog fixtures local and nonindexable.

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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
