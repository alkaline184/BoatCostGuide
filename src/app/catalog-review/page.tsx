import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingPage } from "@/components/shopping/page-shell";
import { money } from "@/lib/formatting/money";
import { publicationDate } from "@/lib/marine/catalog-server";
import { manufacturerReview } from "@/lib/marine/manufacturer-review-server";
import { manufacturerSources } from "@/lib/marine/manufacturers";
import {
  categoryMap,
  modelPath,
  normalizeReviewRow,
  priceBasisLabel,
  startingPrice,
} from "@/lib/marine/shopping";
import { reviewIdentity } from "@/lib/marine/manufacturer-ingestion";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private Manufacturer Catalog Review",
  robots: { index: false, follow: false },
};
const path = "/catalog-review";
const measurement = (
  raw: { value: number | [number, number]; unit: string } | undefined,
  normalized: number | undefined,
  unit: string,
) => {
  if (normalized === undefined) return "Unavailable";
  const original = raw
    ? Array.isArray(raw.value)
      ? `${raw.value[0]} ft ${raw.value[1]} in`
      : `${raw.value} ${raw.unit}`
    : `${normalized} ${unit}`;
  return `${original} → ${normalized} ${unit}`;
};

export default async function CatalogReview({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; year?: string }>;
}) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CATALOG_LOCAL_REVIEW !== "1"
  )
    notFound();
  const request = await headers();
  const forwarded = request.get("x-forwarded-for");
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(
      request.get("host") ?? "",
    ) ||
    (forwarded &&
      !/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(forwarded)) ||
    request.get("sec-fetch-site") === "cross-site"
  )
    notFound();
  const today = publicationDate();
  const intake = await manufacturerReview(today);
  const params = await searchParams;
  const rows = [...intake.baseline, ...intake.rows];
  const current = rows.filter((row) =>
    startingPrice(normalizeReviewRow(row), today),
  ).length;
  const raw = new Map(
    intake.batches.flatMap(({ accepted }) =>
      accepted.map(
        ({ row, original }) => [reviewIdentity(row), original] as const,
      ),
    ),
  );
  const brands = [...new Set(rows.map((row) => row.brand))].sort();
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => b - a);
  const matching = rows.filter(
    (row) =>
      (!params.brand || params.brand === row.brand) &&
      (!params.year || params.year === String(row.year)),
  );
  return (
    <ShoppingPage
      title="Manufacturer catalog review"
      intro="Inspect US model-year evidence, price bases and source units before proposing publication."
      crumbs={[["Catalog review", path]]}
      reviewing={true}
    >
      <dl className="research-specs">
        <div>
          <dt>Verified US variants</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Brands</dt>
          <dd>{brands.length}</dd>
        </div>
        <div>
          <dt>Current price observations</dt>
          <dd>{current}</dd>
        </div>
        <div>
          <dt>Intake exceptions</dt>
          <dd>{intake.rejected.length}</dd>
        </div>
      </dl>
      <section className="catalog-scenario">
        <h2>Review a batch</h2>
        <p>
          Export proposed additions with{" "}
          <code>npm run catalog:intake -- --proposal</code>. Review source
          conflicts and record written clearance before editing the approved
          catalog.
        </p>
        <div className="discovery-actions">
          <Link href="/boats">Open Boat Explorer</Link>
          <Link href="/compare">Compare boats</Link>
        </div>
        <form action={path} className="shop-fields">
          <label className="tool-select">
            Manufacturer
            <select name="brand" defaultValue={params.brand ?? ""}>
              <option value="">All</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {manufacturerSources[brand].name} (
                  {rows.filter((row) => row.brand === brand).length})
                </option>
              ))}
            </select>
          </label>
          <label className="tool-select">
            Model year
            <select name="year" defaultValue={params.year ?? ""}>
              <option value="">All</option>
              {years.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <button className="button" type="submit">
            Apply filters
          </button>
        </form>
        {intake.rejected.length > 0 && (
          <ul>
            {intake.rejected.map((item, i) => (
              <li key={i}>
                {item.brand}, row {item.row} · {item.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="catalog-scenario">
        <h2>{matching.length} variants to review</h2>
        {matching.map((row) => {
          const boat = normalizeReviewRow(row);
          const item = raw.get(reviewIdentity(row));
          const price = boat.variant.prices[0]?.value;
          return (
            <details
              className="tool-details catalog-disclosure"
              key={boat.variant.id}
            >
              <summary>
                {row.year} {boat.manufacturer.name} {row.family} · {row.trim}
              </summary>
              <div className="catalog-budget">
                <p>
                  {categoryMap[row.category].label} · US ·{" "}
                  {boat.variant.source.retrievedAt}
                </p>
                <p>
                  Commercial display and indexing clearance pending. Model photo
                  unavailable. Research uses a labeled category illustration.
                </p>
                <dl className="research-specs">
                  <div>
                    <dt>Overall length</dt>
                    <dd>{measurement(item?.facts.length, row.length, "in")}</dd>
                  </div>
                  <div>
                    <dt>{row.widthBasis ?? "Beam or width"}</dt>
                    <dd>{measurement(item?.facts.beam, row.beam, "in")}</dd>
                  </div>
                  <div>
                    <dt>Dry weight</dt>
                    <dd>
                      {measurement(item?.facts.weight, row.weight, "lb")}
                      {row.weightBasis ? ` · ${row.weightBasis}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Passengers</dt>
                    <dd>{row.capacity ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>Fuel capacity</dt>
                    <dd>{measurement(item?.facts.fuel, row.fuel, "US gal")}</dd>
                  </div>
                  <div>
                    <dt>Storage capacity</dt>
                    <dd>
                      {measurement(item?.facts.storage, row.storage, "US gal")}
                    </dd>
                  </div>
                  <div>
                    <dt>Engine</dt>
                    <dd>
                      {row.engines} × {row.engine} · {row.propulsion ?? "jet"}
                    </dd>
                  </div>
                  <div>
                    <dt>Installed horsepower</dt>
                    <dd>{row.hp ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>Displacement</dt>
                    <dd>
                      {measurement(
                        item?.facts.displacement,
                        row.displacement,
                        "cc",
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Hull material</dt>
                    <dd>{row.hull ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>USD price</dt>
                    <dd>
                      {price
                        ? `${money(price.amount)} · ${priceBasisLabel(price)}`
                        : "Unavailable"}
                      {price && !price.historical && !startingPrice(boat, today)
                        ? " · Stale"
                        : ""}
                    </dd>
                  </div>
                </dl>
                {!!price?.excludedItems?.length && (
                  <p>Price exclusions · {price.excludedItems.join(", ")}</p>
                )}
                <ul>
                  <li>
                    <a href={row.url}>Manufacturer specifications</a>
                  </li>
                  {row.yearUrl && row.yearUrl !== row.url && (
                    <li>
                      <a href={row.yearUrl}>US model-year evidence</a>
                    </li>
                  )}
                  {row.priceUrl && row.priceUrl !== row.url && (
                    <li>
                      <a href={row.priceUrl}>Manufacturer price basis</a>
                    </li>
                  )}
                  {item?.checks?.map((check) => (
                    <li key={check.field}>
                      <a href={check.url}>Corroboration · {check.field}</a>
                    </li>
                  ))}
                  <li>
                    <a href={manufacturerSources[row.brand].terms}>
                      Manufacturer terms
                    </a>
                  </li>
                </ul>
                <p>
                  <Link href={modelPath(boat) + "?variant=" + boat.variant.id}>
                    Open model research
                  </Link>
                </p>
              </div>
            </details>
          );
        })}
      </section>
    </ShoppingPage>
  );
}
