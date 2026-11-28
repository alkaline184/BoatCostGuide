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
  record: ShoppingRecord;
  asOf: string;
  eager?: boolean;
}) {
  const image = record.variant.images.find(
    ({ source, value }) =>
      value?.role === "model-photo" && canPublish(source, asOf, true),
  )?.value;
  return (
    <figure className="catalog-photo">
      <div>
        <Image
          src={image?.path ?? categoryMap[record.model.category].image}
          alt={image?.alt ?? ""}
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
  record: ShoppingRecord;
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
    ["Overall length", formatObservation(s.length)],
    [
      "Beam or width",
      formatObservation(s.beam) +
        (s.widthBasis?.value ? ` (${s.widthBasis.value.toLowerCase()})` : ""),
    ],
    ["Draft", formatObservation(s.draft)],
    ["Dry weight", formatObservation(s.dryWeight)],
    ["Weight definition", s.dryWeightBasis?.value ?? "Unavailable"],
    ["Rated capacity", formatObservation(s.passengers)],
    ["Fuel capacity", formatObservation(s.fuelCapacity)],
    ["Storage capacity", local(s.storageCapacity)],
    ["Hull material", s.hullMaterial?.value ?? "Unavailable"],
    ["Propulsion", engine?.type ?? "Unavailable"],
    ["Engine", engine?.name ?? "Unavailable"],
    ["Engine count", engine?.count?.toString() ?? "Unavailable"],
    [
      "Installed power",
      engine?.totalPower
        ? `${engine.totalPower.amount} ${engine.totalPower.unit}`
        : "Unavailable",
    ],
    [
      "Displacement per engine",
      engine?.displacement
        ? `${engine.displacement.amount} ${engine.displacement.unit}`
        : "Unavailable",
    ],
  ] as const;
}
