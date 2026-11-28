import type { BoatCategory } from "../../content/boat-types";

export type License = Readonly<{
  status: "approved" | "unknown" | "restricted";
  commercialDisplay: boolean;
  indexableDisplay: boolean;
  storage: "none" | "temporary" | "persistent";
  expiresAt: string | null;
  attribution: string | null;
  restrictions: readonly string[];
}>;

export type Source = Readonly<{
  provider: string;
  originalId: string | null;
  url: string;
  retrievedAt: string;
  verification: "verified" | "supplier-reported" | "unverified" | "fixture";
  license: License;
}>;

export type Observation<T> = Readonly<{
  value: T | null;
  modelYear: number;
  source: Source;
}>;
export type Measurement<Unit extends string> = Readonly<{
  amount: number;
  unit: Unit;
}>;
type Length = Measurement<"ft" | "in" | "m" | "cm">;
type Weight = Measurement<"lb" | "kg">;
type Fuel = Measurement<"US gal" | "L">;
type Power = Measurement<"hp" | "kW">;

export type Manufacturer = {
  id: string;
  name: string;
  website: string | null;
  mic: string | null;
  source: Source;
};
export type BoatModel = {
  id: string;
  manufacturerId: string;
  name: string;
  category: BoatCategory | "sailboat" | "other";
  source: Source;
};
export type ModelYear = {
  id: string;
  modelId: string;
  year: number;
  market: "US";
  source: Source;
};
export type Engine = {
  type: "outboard" | "inboard" | "stern-drive" | "jet" | "electric" | "none";
  count: number | null;
  name?: string;
  totalPower?: Power | null;
  displacement?: Measurement<"cc" | "L"> | null;
  powerPerEngine: Power | null;
  fuel: "gasoline" | "diesel" | "electric" | null;
};
export type Specifications = {
  length: Observation<Length>;
  beam: Observation<Length>;
  draft: Observation<Length>;
  dryWeight: Observation<Weight>;
  dryWeightBasis?: Observation<string>;
  storageCapacity?: Observation<Fuel>;
  hullMaterial?: Observation<string>;
  fuelCapacity: Observation<Fuel>;
  passengers: Observation<Measurement<"persons">>;
  engine: Observation<Engine>;
  performance: Observation<{
    topSpeed: Measurement<"mph" | "kn"> | null;
    fuelBurnAtCruise: Measurement<"US gal/h" | "L/h"> | null;
    testConditions: string;
  }>;
};
export type PriceObservation = Observation<{
  kind:
    | "manufacturer-starting"
    | "promotional"
    | "msrp"
    | "dealer-asking"
    | "actual-sale"
    | "estimated-market";
  amount: number;
  currency: "USD";
  observedAt: string;
  includedItems: readonly string[];
  excludedItems?: readonly string[];
}>;
export type ImageAsset = Observation<{
  path: string;
  alt: string;
  role: "model-photo" | "category-illustration";
  credit: string | null;
}>;
export type Recall = Observation<{
  campaignId: string;
  publishedAt: string | null;
  applicability: "confirmed" | "candidate";
  affectedModelYears: readonly number[];
  summary: string;
}>;
export type BoatVariant = {
  id: string;
  modelYearId: string;
  name: string | null;
  source: Source;
  specs: Specifications;
  prices: readonly PriceObservation[];
  images: readonly ImageAsset[];
  recalls: readonly Recall[];
};
export type CatalogRecord = {
  manufacturer: Manufacturer;
  model: BoatModel;
  modelYear: ModelYear;
  variant: BoatVariant;
};
export interface MarineProvider {
  readonly id: string;
  getVariant(externalId: string): Promise<CatalogRecord | null>;
  listVariants(
    cursor?: string,
  ): Promise<{ records: readonly CatalogRecord[]; nextCursor: string | null }>;
}

export function canPublish(source: Source, asOf: string, indexable = false) {
  const { license } = source;
  return (
    source.verification !== "fixture" &&
    license.status === "approved" &&
    license.commercialDisplay &&
    (!indexable || license.indexableDisplay) &&
    (license.expiresAt === null || license.expiresAt > asOf)
  );
}

export function formatObservation<U extends string>(
  observation: Observation<Measurement<U>>,
) {
  if (observation.value === null) return "Unavailable";
  const { amount, unit } = observation.value;
  return `${new Intl.NumberFormat("en-US").format(amount)} ${unit}`;
}

export function recordsHaveConsistentIdentity(record: CatalogRecord) {
  const { manufacturer, model, modelYear, variant } = record;
  const observations = [
    ...Object.values(variant.specs),
    ...variant.prices,
    ...variant.images,
    ...variant.recalls,
  ];
  return (
    model.manufacturerId === manufacturer.id &&
    modelYear.modelId === model.id &&
    variant.modelYearId === modelYear.id &&
    Number.isInteger(modelYear.year) &&
    observations.every(
      (observation) => observation?.modelYear === modelYear.year,
    )
  );
}
