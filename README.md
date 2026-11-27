# BoatCostGuide

BoatCostGuide is an independent financial planning site for boat buyers and owners in the United States. The Phase 1 homepage models fixed-rate boat payments and recurring ownership expenses in USD. It includes a buying guide, FAQ, public methodology, and privacy and terms pages.

## Run locally

Use Node.js 22.19 or newer within the Node 22 LTS line and npm.

```sh
nvm use
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Phase 1 requires no environment variables or service credentials.

## Scripts

| Command                | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the development server                              |
| `npm run build`        | Compile and prerender production routes                   |
| `npm start`            | Serve the existing production build                       |
| `npm run lint`         | Run ESLint                                                |
| `npm run typecheck`    | Check strict TypeScript                                   |
| `npm run format`       | Format source and documentation                           |
| `npm run format:check` | Check formatting                                          |
| `npm test`             | Run Vitest finance and input tests                        |
| `npm run test:e2e`     | Start the built app on port 3100 and test with Playwright |

For browser tests, run `npx playwright install chromium`, then `npm run build` and `npm run test:e2e`. If Chrome is already installed, set `PLAYWRIGHT_CHANNEL=chrome` to use it. Tests cover desktop, tablet and mobile Chromium profiles, with homepage screenshots under `test-results`.

## Technology and layout

Next.js App Router, React, strict TypeScript, Tailwind CSS, Lucide icons and locally served variable fonts. Native controls and a CSS breakdown keep calculator interaction lightweight. See [architecture](docs/ARCHITECTURE.md) and [repository conventions](AGENTS.md).

## Financial methodology

Financed principal equals price minus the down payment. The fixed-rate loan payment discounts an equal monthly payment stream at the nominal annual interest rate divided by 12. Zero interest divides principal by the number of payments. Monthly cash outflow adds the loan payment and user-entered operating expenses. Annual cash outflow multiplies that sum by 12 during repayment. See the [public methodology source](src/app/methodology/page.tsx) for formulas and exclusions.

The calculator uses illustrative inputs and whole-year terms. It does not model lender APR, fees, taxes automatically, early payoff, seasonal timing, resale, depreciation or affordability underwriting. Loan and expense quotes should come from the buyer’s own sources.

## Deployment and next phase

Use Vercel with the Next.js framework preset and the repository root as the project directory. See [deployment](docs/DEPLOYMENT.md) for TLS, preview indexing, exact HTTP 301 redirects and launch checks. [Product](docs/PRODUCT.md), [SEO strategy](docs/SEO-STRATEGY.md) and [roadmap](docs/ROADMAP.md) cover launch scope and upcoming work.
