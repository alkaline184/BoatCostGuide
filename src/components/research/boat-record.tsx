import Image from "next/image";
import { formatObservation, type CatalogRecord } from "@/lib/marine/catalog";
import { money } from "@/lib/formatting/money";

export function boatSpecs(record: CatalogRecord) {
  const {
    length,
    beam,
    draft,
    dryWeight,
    passengers,
    fuelCapacity,
    engine,
    performance,
  } = record.variant.specs;
  const power = engine.value?.powerPerEngine;
  const topSpeed = performance.value?.topSpeed;
  const fuelBurn = performance.value?.fuelBurnAtCruise;
  return [
    ["Length overall", formatObservation(length)],
    ["Beam", formatObservation(beam)],
    ["Draft", formatObservation(draft)],
    ["Dry weight", formatObservation(dryWeight)],
    ["Passenger capacity", formatObservation(passengers)],
    ["Fuel capacity", formatObservation(fuelCapacity)],
    ["Propulsion", engine.value?.type ?? "Unavailable"],
    [
      "Top speed (tested)",
      topSpeed ? `${topSpeed.amount} ${topSpeed.unit}` : "Unavailable",
    ],
    [
      "Fuel burn at cruise",
      fuelBurn ? `${fuelBurn.amount} ${fuelBurn.unit}` : "Unavailable",
    ],
    ["Test conditions", performance.value?.testConditions ?? "Unavailable"],
    ["Engine count", engine.value?.count?.toString() ?? "Unavailable"],
    [
      "Power per engine",
      power ? `${power.amount} ${power.unit}` : "Unavailable",
    ],
  ] as const;
}

export function BoatImage({
  record,
  sizes,
  eager = false,
}: {
  record: CatalogRecord;
  sizes: string;
  eager?: boolean;
}) {
  const image = record.variant.images.find(({ value }) => value)?.value;
  return (
    <figure className="research-image">
      {image ? (
        <>
          <div>
            <Image
              src={image.path}
              alt={image.alt}
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
            />
          </div>
          {image.role === "category-illustration" && (
            <figcaption>Illustrative category image</figcaption>
          )}
        </>
      ) : (
        <p>Photography unavailable</p>
      )}
    </figure>
  );
}

const priceLabels = {
  msrp: "MSRP",
  "dealer-asking": "Dealer asking price",
  "actual-sale": "Actual sale price",
  "estimated-market": "Estimated market value",
} as const;

export function priceSummary(record: CatalogRecord) {
  const prices = record.variant.prices.flatMap(({ value }) =>
    value ? [value] : [],
  );
  return prices.length
    ? prices
        .map(
          ({ kind, amount, observedAt }) =>
            `${priceLabels[kind]} ${money(amount)} (${observedAt})`,
        )
        .join(" · ")
    : "Pricing unavailable";
}

export function ManufacturerCard({ record }: { record: CatalogRecord }) {
  const { manufacturer } = record;
  return (
    <div className="research-manufacturer">
      <strong>{manufacturer.name}</strong>
      {manufacturer.website && (
        <a href={manufacturer.website}>Manufacturer website</a>
      )}
    </div>
  );
}

export function ModelCard({ record }: { record: CatalogRecord }) {
  return (
    <article className="research-card">
      <BoatImage record={record} sizes="(max-width: 650px) 75vw, 34vw" />
      <h3>
        {record.modelYear.year} {record.model.name}
      </h3>
      <ManufacturerCard record={record} />
      <p>{priceSummary(record)}</p>
    </article>
  );
}

export function SpecificationSummary({ record }: { record: CatalogRecord }) {
  return (
    <dl className="research-specs">
      {boatSpecs(record).map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
