import type { CatalogCardRecord } from "@/lib/marine/catalog-search";
import { BoatScene } from "@/components/marine/boat-diagrams";
import { diagramFor } from "@/lib/marine/illustrations";
import type { Source } from "@/lib/marine/catalog";
import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/formatting/money";
import { canPublish, formatObservation } from "@/lib/marine/catalog";
import {
  categoryMap,
  financeAtPrice,
  modelPath,
  startingPrice,
  priceBasisLabel,
  type Budget,
  type ShoppingRecord,
} from "@/lib/marine/shopping";

export function CatalogImage({
  record,
  asOf,
  eager = false,
}: {
  record: CatalogCardRecord;
  asOf: string;
  eager?: boolean;
}) {
  const image = record.variant.images.find(
    ({ source, value }) =>
      value?.role === "model-photo" && canPublish(source, asOf, true),
  )?.value;
  if (!image)
    return (
      <figure className="catalog-schematic">
        <BoatScene boats={[diagramFor(record)]} />
        <figcaption>Category illustration</figcaption>
      </figure>
    );
  return (
    <figure className="catalog-photo">
      <div>
        <Image
          src={image.path}
          alt={image.alt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1000px) 45vw, 35vw"
          loading={eager ? "eager" : "lazy"}
        />
      </div>
      <figcaption>
        {image
          ? (image.credit ?? "Manufacturer model photo")
          : "Category illustration"}
      </figcaption>
    </figure>
  );
}

export function CatalogCard({
  record,
  asOf,
  terms,
  operating,
  children,
}: {
  record: CatalogCardRecord;
  asOf: string;
  terms?: Pick<Budget, "down" | "downMode" | "annualRate" | "months">;
  operating?: number;
  children?: React.ReactNode;
}) {
  const price = startingPrice(record, asOf);
  const { length, passengers } = record.variant.specs;
  const payment =
    price && terms
      ? financeAtPrice(price.amount, terms).loan.monthly
      : undefined;
  return (
    <article className="catalog-card">
      <CatalogImage record={record} asOf={asOf} />
      <div className="catalog-card-body">
        <p className="catalog-label">
          {record.modelYear.year} · {categoryMap[record.model.category].label}
        </p>
        <h3>
          <Link href={modelPath(record) + "?variant=" + record.variant.id}>
            {record.manufacturer.name} {record.model.name}
          </Link>
        </h3>
        <p className="catalog-trim">{record.variant.name}</p>
        <p>
          {formatObservation(length)} · {formatObservation(passengers)}
        </p>
        <p className="catalog-price">
          {price ? money(price.amount) : "Price unavailable"}{" "}
          {price && <small>{priceBasisLabel(price)}</small>}
        </p>
        {payment !== undefined && (
          <p>
            {money(payment)} / month financing
            {operating !== undefined && (
              <>
                <br />
                {money(payment + operating)} / month incl. operating costs
              </>
            )}
          </p>
        )}
        {children}
      </div>
    </article>
  );
}

export function specRows(record: ShoppingRecord) {
  const s = record.variant.specs;
  const engine = s.engine.value;
  const local = (item: typeof s.storageCapacity) =>
    item ? formatObservation(item) : "Unavailable";
  return [
    ["Overall length", formatObservation(s.length), s.length.source],
    [
      "Beam or width",
      formatObservation(s.beam) +
        (s.widthBasis?.value ? ` (${s.widthBasis.value.toLowerCase()})` : ""),
      s.beam.source,
    ],
    ["Draft", formatObservation(s.draft), s.draft.source],
    ["Dry weight", formatObservation(s.dryWeight), s.dryWeight.source],
    [
      "Weight definition",
      s.dryWeightBasis?.value ?? "Unavailable",
      s.dryWeightBasis?.source,
    ],
    ["Rated capacity", formatObservation(s.passengers), s.passengers.source],
    ["Fuel capacity", formatObservation(s.fuelCapacity), s.fuelCapacity.source],
    ["Storage capacity", local(s.storageCapacity), s.storageCapacity?.source],
    [
      "Hull material",
      s.hullMaterial?.value ?? "Unavailable",
      s.hullMaterial?.source,
    ],
    ["Propulsion", engine?.type ?? "Unavailable", s.engine.source],
    ["Engine", engine?.name ?? "Unavailable", s.engine.source],
    [
      "Engine count",
      engine?.count?.toString() ?? "Unavailable",
      s.engine.source,
    ],
    [
      "Installed power",
      engine?.totalPower
        ? `${engine.totalPower.amount} ${engine.totalPower.unit}`
        : "Unavailable",
      s.engine.source,
    ],
    [
      "Displacement per engine",
      engine?.displacement
        ? `${engine.displacement.amount} ${engine.displacement.unit}`
        : "Unavailable",
      s.engine.source,
    ],
  ] as const;
}

export function ClaimSource({
  label,
  source,
}: {
  label: string;
  source?: Source;
}) {
  if (!source || !source.url.startsWith("https://")) return null;
  return (
    <a
      className="catalog-source"
      href={source.url}
      aria-label={`Source for ${label}`}
      title={`Checked ${source.retrievedAt}`}
    >
      Source
    </a>
  );
}
