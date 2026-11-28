import { manufacturerSources, type ManufacturerKey } from "./manufacturers.ts";
import type { ReviewRow, ShoppingCategory } from "./shopping";

type Value = number | [number, number];
type Observation = { value: Value; unit: string };
type Fact = "length" | "beam" | "weight" | "fuel" | "storage" | "displacement";

export type EditorialRecord = {
  model: {
    family: string;
    trim: string;
    year: number;
    market: "US";
    category: ShoppingCategory;
  };
  evidence: { url: string; yearUrl: string; verifiedYear: number };
  facts: Partial<Record<Fact, Observation>>;
  checks?: Array<{
    field: Fact;
    observation: Observation;
    url: string;
    year: number;
  }>;
  capacity?: number;
  weightBasis?: string;
  widthBasis?: string;
  hull?: string;
  power: { type: "jet" | "outboard"; count: number; name: string; hp?: number };
  price?: {
    amount: number;
    currency: "USD";
    kind: "msrp" | "manufacturer-starting";
    url: string;
    label?: string;
    historical?: boolean;
    includes?: string[];
    excludes?: string[];
  };
  intendedUse: string;
  editorial: string;
};
export type EditorialBatch = {
  brand: ManufacturerKey;
  observedAt: string;
  records: EditorialRecord[];
};

const units: Record<Fact, Record<string, number>> = {
  length: { in: 1, ft: 12, "ft+in": 1, cm: 1 / 2.54, m: 1 / 0.0254 },
  beam: { in: 1, ft: 12, "ft+in": 1, cm: 1 / 2.54, m: 1 / 0.0254 },
  weight: { lb: 1, kg: 2.2046226218 },
  fuel: { "US gal": 1, L: 1 / 3.785411784 },
  storage: { "US gal": 1, L: 1 / 3.785411784 },
  displacement: { cc: 1, L: 1000 },
};
const ranges: Record<
  ShoppingCategory,
  { length: [number, number]; beam: [number, number] }
> = {
  pwc: { length: [72, 190], beam: [22, 85] },
  jet: { length: [110, 500], beam: [48, 150] },
  pontoon: { length: [120, 520], beam: [55, 180] },
};
const nonempty = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;
const positive = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const integer = (value: unknown, max: number) =>
  positive(value) && Number.isInteger(value) && Number(value) <= max;
const iso = (date: unknown) =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(date)) &&
  new Date(date).toISOString().slice(0, 10) === date;

function isOfficial(value: unknown, brand: ManufacturerKey) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      (manufacturerSources[brand].hosts as readonly string[]).includes(
        parsed.hostname,
      )
    );
  } catch {
    return false;
  }
}
export function normalizedMeasurement(observation: Observation, field: Fact) {
  const { value, unit } = observation;
  if (!Object.hasOwn(units[field], unit))
    throw new Error(`Invalid ${field} unit`);
  if (unit === "ft+in") {
    if (
      !Array.isArray(value) ||
      value.length !== 2 ||
      !value.every(Number.isFinite) ||
      !Number.isInteger(value[0]) ||
      value[0] < 0 ||
      value[1] < 0 ||
      value[1] >= 12 ||
      value[0] * 12 + value[1] <= 0
    )
      throw new Error(`Invalid ${field} feet and inches`);
    return value[0] * 12 + value[1];
  }
  if (typeof value !== "number" || !positive(value))
    throw new Error(`Invalid ${field} value`);
  return Math.round(value * units[field][unit] * 10000) / 10000;
}

function adaptRecord(
  record: EditorialRecord,
  brand: ManufacturerKey,
  date: string,
  asOf: string,
): ReviewRow {
  const { model, evidence, facts, power, price } = record;
  if (
    !model ||
    !nonempty(model.family) ||
    !nonempty(model.trim) ||
    model.market !== "US" ||
    !Object.hasOwn(ranges, model.category) ||
    !integer(model.year, Number(asOf.slice(0, 4)) + 2) ||
    model.year < 1900 ||
    !evidence ||
    evidence.verifiedYear !== model.year ||
    !isOfficial(evidence.url, brand) ||
    !isOfficial(evidence.yearUrl, brand)
  )
    throw new Error(
      "Exact US model-year evidence and official source required",
    );
  if (
    !facts ||
    !facts.length ||
    Object.keys(facts).some((key) => !Object.hasOwn(units, key))
  )
    throw new Error("Expected known fact fields and length evidence");
  const measure = (field: Fact) => {
    const observation = facts[field];
    return observation === undefined
      ? undefined
      : normalizedMeasurement(observation, field);
  };
  for (const check of record.checks ?? []) {
    if (
      !Object.hasOwn(units, check.field) ||
      check.year !== model.year ||
      !isOfficial(check.url, brand)
    )
      throw new Error("Invalid source for a cross-check");
    const original = measure(check.field);
    const alternative = normalizedMeasurement(check.observation, check.field);
    const tolerances: Record<Fact, number> = {
      length: 0.75,
      beam: 0.75,
      weight: 3,
      fuel: 0.2,
      storage: 0.2,
      displacement: 2,
    };
    if (
      original === undefined ||
      Math.abs(original - alternative) > tolerances[check.field]
    )
      throw new Error(
        `Conflicting ${check.field} observations. Resolve before import.`,
      );
  }
  const length = measure("length")!;
  const beam = measure("beam");
  const bounds = ranges[model.category];
  if (
    length < bounds.length[0] ||
    length > bounds.length[1] ||
    (beam !== undefined &&
      (beam < bounds.beam[0] || beam > bounds.beam[1] || beam >= length))
  )
    throw new Error(
      "Category dimensions implausible. Verify the original source units.",
    );
  if (
    !power ||
    !["jet", "outboard"].includes(power.type) ||
    !integer(power.count, 6) ||
    !nonempty(power.name) ||
    (record.capacity !== undefined && !integer(record.capacity, 30)) ||
    (power.hp !== undefined && (!positive(power.hp) || power.hp > 1800)) ||
    (facts.weight !== undefined && !nonempty(record.weightBasis)) ||
    !nonempty(record.intendedUse) ||
    !nonempty(record.editorial)
  )
    throw new Error(
      "Engine, capacity, weight definition or editorial evidence invalid",
    );
  if (
    price &&
    (!positive(price.amount) ||
      price.amount > 2_000_000 ||
      price.currency !== "USD" ||
      !["manufacturer-starting", "msrp"].includes(price.kind) ||
      !isOfficial(price.url, brand) ||
      [price.includes, price.excludes].some(
        (items) =>
          items !== undefined &&
          (!Array.isArray(items) || !items.every(nonempty)),
      ))
  )
    throw new Error("Invalid manufacturer price, basis or source");
  return {
    brand,
    observedAt: date,
    family: model.family,
    trim: model.trim,
    year: model.year,
    category: model.category,
    url: evidence.url,
    yearUrl: evidence.yearUrl,
    length,
    beam,
    widthBasis: record.widthBasis,
    weight: measure("weight"),
    weightBasis: record.weightBasis,
    capacity: record.capacity,
    fuel: measure("fuel"),
    storage: measure("storage"),
    displacement: measure("displacement"),
    hp: power.hp,
    engine: power.name,
    engines: power.count,
    propulsion: power.type,
    hull: record.hull,
    price: price?.amount,
    priceKind: price?.kind,
    priceLabel: price?.label,
    historicalPrice: price?.historical,
    priceUrl: price?.url,
    includes: price?.includes,
    excludes: price?.excludes,
    intendedUse: record.intendedUse,
    editorial: record.editorial,
  };
}

export const reviewIdentity = (
  row: Pick<ReviewRow, "brand" | "family" | "trim" | "year">,
) =>
  [row.brand, row.family, row.year, row.trim]
    .map((value) =>
      String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .join("/");

export function adaptEditorialBatches(
  inputs: readonly unknown[],
  asOf: string,
  baseline: readonly ReviewRow[] = [],
) {
  if (!iso(asOf)) throw new Error("Select a valid report date");
  const batches: Array<{
    batch: EditorialBatch;
    accepted: Array<{ row: ReviewRow; original: EditorialRecord }>;
  }> = [];
  const rejected: Array<{ brand: string; row: number; reason: string }> = [];
  const seen = new Map(baseline.map((row) => [reviewIdentity(row), row]));
  for (const input of inputs) {
    const batch = input as EditorialBatch;
    if (
      !batch ||
      !Object.hasOwn(manufacturerSources, batch.brand) ||
      !iso(batch.observedAt) ||
      batch.observedAt > asOf ||
      !Array.isArray(batch.records)
    ) {
      rejected.push({
        brand: "Unknown",
        row: 0,
        reason: "Unrecognized manufacturer, date or batch schema",
      });
      continue;
    }
    const accepted: Array<{ row: ReviewRow; original: EditorialRecord }> = [];
    batch.records.forEach((record, index) => {
      try {
        const row = adaptRecord(record, batch.brand, batch.observedAt, asOf);
        const identity = reviewIdentity(row);
        const prior = seen.get(identity);
        if (prior) {
          const conflict = (
            [
              "length",
              "beam",
              "weight",
              "capacity",
              "fuel",
              "hp",
              "displacement",
              "engine",
              "engines",
              "price",
              "priceKind",
            ] as const
          ).some((key) => prior[key] !== row[key]);
          throw new Error(
            conflict
              ? "Conflicting observation for existing identity"
              : "Duplicate identity",
          );
        }
        seen.set(identity, row);
        accepted.push({ row, original: record });
      } catch (error) {
        rejected.push({
          brand: batch.brand,
          row: index + 1,
          reason: error instanceof Error ? error.message : "Invalid record",
        });
      }
    });
    batches.push({ batch, accepted });
  }
  return {
    batches,
    rows: batches.flatMap((item) => item.accepted.map(({ row }) => row)),
    rejected,
  };
}
