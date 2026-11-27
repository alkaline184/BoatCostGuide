# Deployment

## Vercel setup after approval

Import `alkaline184/BoatCostGuide` with the Next.js preset, repository root, npm install/build defaults, production branch `main` and Node.js 22.x. No application environment variables are required. Configure Deployment Protection for previews and retain Vercel system environment variables so the app can add a preview `X-Robots-Tag`. Vercel also documents automatic preview noindex headers. Keep preview URLs off production domains and verify response headers after setup. [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) · [Vercel response headers](https://vercel.com/docs/headers/response-headers)

Attach `boatcostguide.com` to the production project and use DNS records Vercel provides. Verify TLS and that HTTP redirects to HTTPS with the original path and query. Vercel supplies HSTS on hosted responses.

## Alias redirects

Use an HTTPS-capable edge redirect service with an explicit 301. For example, with Cloudflare Single Redirects, proxy each alias and issue edge certificates covering it. Create one rule for each source hostname:

| Request URL wildcard              | Dynamic target                   |
| --------------------------------- | -------------------------------- |
| `http*://www.boatcostguide.com/*` | `https://boatcostguide.com/${2}` |
| `http*://myboatbudget.com/*`      | `https://boatcostguide.com/${2}` |
| `http*://www.myboatbudget.com/*`  | `https://boatcostguide.com/${2}` |

Select **301** and enable **Preserve query string** on each rule. The first wildcard matches the protocol suffix and the second captures the path. Use a provider-supported DNS setup for the canonical Vercel domain and leave it outside the alias rules. The literal destination origin prevents host reflection and loops. Cloudflare’s official settings specify 301, distinguish it from 308 and document wildcard captures and query behavior. [Cloudflare redirect settings](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/) · [WWW-to-root example](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/)

Verify each alias using an actual first-hop GET after DNS and TLS are live. The expected status is 301 and the expected Location is `https://boatcostguide.com/methodology?source=launch`.

```sh
for host in www.boatcostguide.com myboatbudget.com www.myboatbudget.com; do
  curl -sS -o /dev/null -D - "https://$host/methodology?source=launch"
done
curl -sS -o /dev/null -D - 'http://boatcostguide.com/methodology?source=launch'
```

Phase 1 documents the configuration. Live behavior can be verified after the owner provisions the domains.

## Owner inputs before public launch

Confirm the operating party’s legal name and a verified public support or privacy contact. Have the owner review the privacy policy and terms for the final hosting setup, provider access and log handling, and add any applicable policy dates and required disclosures. Confirm commercial hosting arrangements, domain ownership, certificate coverage and deployment protection before connecting the project. After launch, verify the public sitemap, temporary deployment index controls and first-hop redirects.

## CI

GitHub Actions uses Node 22 and read-only repository permissions. It runs npm ci, formatting, lint, TypeScript, unit tests, production build and Chromium tests on pushes to main and feature branches and on pull requests. Production release and domain changes remain separate.
