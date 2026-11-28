import Link from "next/link";
import { ShoppingPage } from "@/components/shopping/page-shell";
import { ModelScenario } from "@/components/shopping/scenario";
import { ProviderCosts } from "@/components/shopping/provider-costs";
import { localBoatDb } from "@/lib/marine/providers/theboatdb/local";
import type { ProviderBoat } from "@/lib/marine/providers/theboatdb/repository";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private Boat Explorer",
  robots: { index: false, follow: false },
};
const route = "/provider-review";
const title = (boat: ProviderBoat) =>
  [boat.maker, boat.model, boat.version].filter(Boolean).join(" ");
const text = (value: string | number | null) => value ?? "Unavailable";
const years = ({ firstYear, lastYear }: ProviderBoat) =>
  firstYear === null
    ? "Unavailable"
    : lastYear === firstYear
      ? String(firstYear)
      : `${firstYear}–${lastYear ?? "end unreported"}`;
const specs = (boat: ProviderBoat) =>
  [
    ["Provider production window", years(boat)],
    ["Type", text(boat.type)],
    ["Category", boat.categories.join(", ") || "Unavailable"],
    [
      "Overall length",
      boat.lengthMetres === null ? "Unavailable" : `${boat.lengthMetres} m`,
    ],
    ["Beam", boat.beam === null ? "Unavailable" : `${boat.beam} ${boat.unit}`],
    [
      "Draft",
      boat.draft === null ? "Unavailable" : `${boat.draft} ${boat.unit}`,
    ],
    ["Hull material", text(boat.hull)],
    [
      "Engine details",
      boat.engines
        .map((engine) =>
          [
            engine.type,
            engine.model,
            engine.power !== null && engine.powerUnit
              ? `${engine.power} ${engine.powerUnit}`
              : null,
          ]
            .filter(Boolean)
            .join(" "),
        )
        .filter(Boolean)
        .join(" / ") || "Unavailable",
    ],
    [
      "Reference price",
      boat.reference
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: boat.reference.currency,
          }).format(boat.reference.amount)
        : "Unavailable",
    ],
  ] as const;
function Photo({ boat, index = 0 }: { boat: ProviderBoat; index?: number }) {
  const image = boat.photos[index];
  if (!image) return <p className="catalog-note">Model photo unavailable</p>;
  return (
    <figure className="catalog-photo">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Provider-hosted display preserves the source URL and avoids re-hosting. */}
        <img
          src={image.url}
          alt={
            image.alt ??
            (index ? `${title(boat)}, view ${index + 1}` : title(boat))
          }
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <figcaption>Photo by TheBoatDB</figcaption>
    </figure>
  );
}

export default async function ProviderReview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const repo = await localBoatDb();
  const params = await searchParams;
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const ids = [
    ...new Set(
      (Array.isArray(params.models)
        ? params.models
        : typeof params.models === "string"
          ? params.models.split(",")
          : []
      ).filter((id) => /^[a-z0-9_-]{1,120}$/i.test(id)),
    ),
  ].slice(0, 3);
  const model =
    typeof params.model === "string" &&
    /^[a-z0-9_-]{1,120}$/i.test(params.model)
      ? params.model
      : "";
  const category =
    typeof params.type === "string" && ["power", "sail"].includes(params.type)
      ? params.type
      : "";
  const offset = Math.max(
    0,
    Math.min(
      96,
      Number.parseInt(
        typeof params.offset === "string" ? params.offset : "",
        10,
      ) || 0,
    ),
  );
  const href = (values: Record<string, string>) =>
    route + "?" + new URLSearchParams(values);
  let error = "";
  let boats: ProviderBoat[] = [];
  let total = 0;
  try {
    if (repo) {
      if (model) boats = [await repo.detail(model)];
      else if (ids.length >= 2)
        boats = await Promise.all(ids.map((id) => repo.detail(id)));
      else {
        const page = await repo.search({
          limit: 12,
          offset,
          ...(query.length >= 2 ? { search: query } : {}),
          ...(category ? { type: category } : {}),
        });
        total = page.total;
        boats = page.data;
      }
    }
  } catch {
    error =
      "The provider could not complete this request. Try a different search or return later.";
  }
  const detail = model ? boats[0] : null;
  return (
    <ShoppingPage
      title={
        detail
          ? title(detail)
          : ids.length >= 2
            ? "Compare provider records"
            : "Private Boat Explorer"
      }
      intro="Live boat research for local evaluation."
      crumbs={[["Private Boat Explorer", route]]}
      reviewing={false}
    >
      <p className="research-notice">
        <a href="https://theboatdb.com/">Data by TheBoatDB</a>. Production
        windows describe build periods. US model years and market availability
        require separate confirmation.
      </p>
      {repo && !model && ids.length === 1 && (
        <p role="status">Select two or three boats to compare.</p>
      )}
      {!repo && (
        <p className="catalog-empty">
          A live TheBoatDB key is required for this preview.
        </p>
      )}
      {error && (
        <p className="catalog-empty" role="status">
          {error}
        </p>
      )}
      {repo && (model || ids.length >= 2) && (
        <p>
          <Link href={route} prefetch={false}>
            Back to exploration
          </Link>
        </p>
      )}
      {repo && !model && ids.length < 2 && (
        <>
          <form action={route} className="shop-fields">
            <label className="tool-select">
              Search model{" "}
              <input
                type="search"
                name="q"
                minLength={2}
                maxLength={100}
                defaultValue={query}
              />
            </label>
            <label className="tool-select">
              Boat type{" "}
              <select name="type" defaultValue={category}>
                <option value="">Any</option>
                <option value="power">Power</option>
                <option value="sail">Sail</option>
              </select>
            </label>
            <button type="submit" className="button">
              Search boats
            </button>
          </form>
          {!error && (
            <p role="status">
              {total} provider records match. Showing up to 12 per page.
            </p>
          )}
          {!boats.length && !error && (
            <p className="catalog-empty">
              No results. Try the manufacturer’s model name or a shorter search.
            </p>
          )}
          {!!boats.length && (
            <form action={route}>
              <p>Select two or three models on this page to compare.</p>
              <div className="catalog-grid">
                {boats.map((boat) => (
                  <article key={boat.id} className="catalog-card">
                    <Photo boat={boat} />
                    <div className="catalog-card-body">
                      <p className="catalog-label">
                        {text(boat.type)} · {years(boat)}
                      </p>
                      <h2>
                        <Link href={href({ model: boat.id })} prefetch={false}>
                          {title(boat)}
                        </Link>
                      </h2>
                      <label className="research-toggle">
                        <input type="checkbox" name="models" value={boat.id} />{" "}
                        Compare {title(boat)}
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              <p>
                <button className="button" type="submit">
                  Compare selected boats
                </button>
              </p>
            </form>
          )}
          <nav aria-label="Provider result pages" className="discovery-actions">
            {offset > 0 && (
              <Link
                prefetch={false}
                href={href({
                  q: query,
                  type: category,
                  offset: String(Math.max(0, offset - 12)),
                })}
              >
                Previous page
              </Link>
            )}
            {total > offset + 12 && offset < 96 && (
              <Link
                prefetch={false}
                href={href({
                  q: query,
                  type: category,
                  offset: String(offset + 12),
                })}
              >
                Next page
              </Link>
            )}
          </nav>
        </>
      )}
      {detail && (
        <div className="catalog-model-grid">
          <section>
            <Photo boat={detail} />
            {detail.photos.length > 1 && (
              <details>
                <summary>More photos</summary>
                {detail.photos.slice(1, 6).map(({ url }, i) => (
                  <Photo key={url} boat={detail} index={i + 1} />
                ))}
              </details>
            )}
            <h2>Specifications</h2>
            <dl className="research-specs">
              {specs(detail).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="catalog-note">
              The provider reference price is indicative. Use a current purchase
              quote in the ownership scenario.
            </p>
            {detail.makerWebsite && (
              <a href={detail.makerWebsite}>Manufacturer website</a>
            )}
          </section>
          <ModelScenario />
        </div>
      )}
      {!model && ids.length >= 2 && boats.length >= 2 && (
        <>
          <div
            className="tool-table catalog-table"
            tabIndex={0}
            role="region"
            aria-label="Provider model comparison"
          >
            <table>
              <caption>Provider specifications</caption>
              <thead>
                <tr>
                  <th scope="col">Specification</th>
                  {boats.map((boat) => (
                    <th scope="col" key={boat.id}>
                      <Link prefetch={false} href={href({ model: boat.id })}>
                        {title(boat)}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs(boats[0]).map(([label], i) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {boats.map((boat) => (
                      <td key={boat.id}>{specs(boat)[i][1]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ProviderCosts key={ids.join(",")} names={boats.map(title)} />
        </>
      )}
    </ShoppingPage>
  );
}
