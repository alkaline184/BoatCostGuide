# BoatCostGuide

BoatCostGuide is an independent boat research and ownership planning site for boat buyers and owners in the United States. The homepage introduces eight boat types and four dedicated tools for loan payments and amortization, affordability, ownership costs and early payoff. All estimates use USD. The site includes original guides and a public methodology.

## Run locally

Use Node.js 22.19 or newer within the Node 22 LTS line and npm.

```sh
nvm use
npm ci
npm run dev -- --port 3005
```

Open [localhost:3005](http://localhost:3005). The application requires no environment variables or service credentials.

## Scripts

| Command                | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Start the development server                                           |
| `npm run build`        | Compile and prerender production routes                                |
| `npm start`            | Serve the existing production build                                    |
| `npm run lint`         | Run ESLint                                                             |
| `npm run typecheck`    | Check strict TypeScript                                                |
| `npm run format`       | Format source and documentation                                        |
| `npm run format:check` | Check formatting                                                       |
| `npm test`             | Run Vitest finance and input tests                                     |
| `npm run test:e2e`     | Test the production app on port 3100 and local prototypes on port 3101 |

For browser tests, run `npx playwright install chromium`, then `npm run build` and `npm run test:e2e`. If Chrome is already installed, set `PLAYWRIGHT_CHANNEL=chrome` to use it. Tests cover desktop, tablet and mobile Chromium profiles, with homepage and calculator screenshots under `test-results`.

## Research prototypes

Start the production preview using `npm run build` and `npm start -- --port 3005`. To review the fictional prototypes separately, run `npm run dev -- --port 3006` and open [model detail](http://localhost:3006/research-preview/model) or [comparison](http://localhost:3006/research-preview/compare). They return 404 in production.

See [marine data research](docs/MARINE-DATA-RESEARCH.md), [manufacturer feasibility](docs/MANUFACTURER-DATA.md), [catalog architecture](docs/MARINE-ARCHITECTURE.md) and [visual assets](docs/VISUAL-ASSETS.md).

## Technology and layout

Next.js App Router, React, strict TypeScript, Tailwind CSS, Lucide icons and locally served variable fonts. Native controls and a CSS breakdown keep calculator interaction lightweight. See [architecture](docs/ARCHITECTURE.md) and [repository conventions](AGENTS.md).

## Financial methodology

All four tools share a fixed-rate monthly loan model. See the [financial methodology](docs/FINANCIAL-METHODOLOGY.md) for examples, equations, rounding and exclusions. CI runs formatting, lint, type checking, unit tests, production build and Chromium end-to-end checks with read-only repository permissions.

## Deployment and next phase

Use Vercel with the Next.js framework preset and the repository root as the project directory. See [deployment](docs/DEPLOYMENT.md) for TLS, preview indexing, exact HTTP 301 redirects and launch checks. [Product](docs/PRODUCT.md), [SEO strategy](docs/SEO-STRATEGY.md) and [roadmap](docs/ROADMAP.md) cover launch scope and upcoming work.

### Catalog development

Use `npm run dev -- --hostname 127.0.0.1 --port 3006` for the local model review. Use `npm run build` followed by `npm run start -- --hostname 127.0.0.1 --port 3005` for the production preview. Phase 3B includes 21 verified variants awaiting publication clearance. Production Boat Explorer currently offers the official lineup directory and planning tools. See [catalog ingestion](docs/CATALOG-INGESTION.md) and [catalog quality](docs/CATALOG-QUALITY.md).

Phase 3B.2 expands local catalog coverage to 50 verified variants. Run `npm run catalog:intake` for the intake report and `npm run dev:catalog` for the [private manufacturer review](http://127.0.0.1:3005/catalog-review).
