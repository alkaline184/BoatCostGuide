import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingPage } from "@/components/shopping/page-shell";
import {
  CatalogCard,
  CatalogImage,
  specRows,
} from "@/components/shopping/catalog-ui";
import { ModelScenario } from "@/components/shopping/scenario";
import {
  catalogForRequest,
  publicationDate,
} from "@/lib/marine/catalog-server";
import {
  categoryMap,
  modelPath,
  similarBoats,
  startingPrice,
} from "@/lib/marine/shopping";
import { pageMetadata } from "@/lib/seo/metadata";
import { money } from "@/lib/formatting/money";

type Props = {
  params: Promise<{ manufacturer: string; model: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
};
async function getModel(params: Props["params"]) {
  const { manufacturer, model } = await params;
  const { records, reviewing } = await catalogForRequest();
  const variants = records
    .filter(
      (boat) =>
        boat.manufacturer.id === manufacturer && boat.model.id === model,
    )
    .sort(
      (a, b) =>
        b.modelYear.year - a.modelYear.year ||
        a.variant.id.localeCompare(b.variant.id),
    );
  if (!variants.length) notFound();
  return { variants, records, reviewing };
}
export async function generateMetadata({ params, searchParams }: Props) {
  const { variants, reviewing } = await getModel(params);
  const query = await searchParams;
  const record = variants[0];
  return pageMetadata(modelPath(record), {
    title: `${record.manufacturer.name} ${record.model.name} Specs, Price & Ownership Costs`,
    description: `Research ${record.manufacturer.name} ${record.model.name} US specifications, compare available model years and estimate monthly and five-year costs.`,
    noindex: reviewing || Boolean(query.variant),
  });
}
export default async function Model({ params, searchParams }: Props) {
  const { variants, records, reviewing } = await getModel(params);
  const { variant } = await searchParams;
  const record =
    variants.find((item) => item.variant.id === variant) ?? variants[0];
  const name = record.manufacturer.name + " " + record.model.name;
  const asOf = publicationDate();
  const price = startingPrice(record, asOf);
  const suggestions = similarBoats(record, records, asOf);
  const category = categoryMap[record.model.category];
  const brandHasPage =
    new Set(
      records
        .filter((item) => item.manufacturer.id === record.manufacturer.id)
        .map((item) => item.model.id),
    ).size >= 2;
  const categoryHasPage =
    new Set(
      records
        .filter((item) => item.model.category === record.model.category)
        .map((item) => item.manufacturer.id + item.model.id),
    ).size >= 2;
  return (
    <ShoppingPage
      title={name}
      intro={`${record.modelYear.year} US model · ${record.variant.name} · ${category.label}`}
      reviewing={reviewing}
      crumbs={[
        ["Boat Explorer", "/boats"],
        ...(brandHasPage
          ? [
              [
                record.manufacturer.name,
                "/boats/" + record.manufacturer.id,
              ] as [string, string],
            ]
          : []),
        [record.model.name, modelPath(record)],
      ]}
    >
      <div className="catalog-model-hero">
        <div className="catalog-model-info">
          <p className="catalog-price">
            {price ? money(price.amount) : "Starting price unavailable"}{" "}
            {price && <small>manufacturer starting price</small>}
          </p>
          {price?.includedItems.length ? (
            <p>Included in source price: {price.includedItems.join(", ")}.</p>
          ) : null}
          {price?.excludedItems?.length ? (
            <p>Excluded from source price: {price.excludedItems.join(", ")}.</p>
          ) : null}
          <p>
            Check the dealer’s written quote for applicable taxes, fees,
            delivery and options.
          </p>
          {categoryHasPage && (
            <Link
              className="catalog-link"
              href={`/boat-types/${category.slug}`}
            >
              Explore {category.label.toLowerCase()}
            </Link>
          )}
          {records.length >= 2 && (
            <p>
              <Link
                className="button"
                href={`/compare?models=${record.variant.id}`}
              >
                Add to comparison
              </Link>
            </p>
          )}
        </div>
        <CatalogImage record={record} asOf={asOf} eager />
      </div>
      {variants.length > 1 && (
        <nav aria-label="Model years and variants" className="catalog-variants">
          <strong>Model years and variants</strong>
          {variants.map((item) => (
            <Link
              key={item.variant.id}
              className="tool-secondary"
              aria-current={
                record.variant.id === item.variant.id ? "page" : undefined
              }
              href={modelPath(item) + "?variant=" + item.variant.id}
            >
              {item.modelYear.year} · {item.variant.name}
            </Link>
          ))}
        </nav>
      )}
      <div className="catalog-model-grid">
        <section>
          <h2>Specifications</h2>
          <dl className="research-specs">
            {specRows(record).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <ModelScenario key={record.variant.id} price={price?.amount} />
      </div>
      <section className="research-block">
        <h2>Buying considerations</h2>
        <p>{record.editorial}</p>
        <p>Intended use in this guide: {record.intendedUse}.</p>
      </section>
      <section className="research-block">
        <h2>Sources and verification</h2>
        <p>US specifications checked {record.variant.source.retrievedAt}.</p>
        <ul>
          <li>
            <a href={record.variant.source.url}>
              Official specifications for this configuration
            </a>
          </li>
          {record.variant.prices[0]?.source.url !== record.variant.source.url &&
            record.variant.prices.length > 0 && (
              <li>
                <a href={record.variant.prices[0].source.url}>
                  Manufacturer pricing source
                </a>
              </li>
            )}
          {record.manufacturer.website && (
            <li>
              <a href={record.manufacturer.website}>Manufacturer website</a>
            </li>
          )}
        </ul>
      </section>
      {suggestions.length > 0 && (
        <section className="research-block">
          <h2>Similar boats</h2>
          <div className="catalog-grid">
            {suggestions.map(({ candidate, reasons }) => (
              <CatalogCard
                key={candidate.variant.id}
                record={candidate}
                asOf={asOf}
              >
                <p className="catalog-note">{reasons.join(" · ")}</p>
              </CatalogCard>
            ))}
          </div>
        </section>
      )}
    </ShoppingPage>
  );
}
