import { affordability } from "../finance/calculators";
import { fixedLoan, inRange, limits, remainingBalance } from "../finance/loan";
import { downPaymentAmount } from "../finance/boat-cost";
import {
  canPublish,
  recordsHaveConsistentIdentity,
  type CatalogRecord,
  type Observation,
  type PriceObservation,
  type Source,
} from "./catalog";

export const categoryMap = {
  pwc: {
    label: "Personal watercraft",
    slug: "personal-watercraft",
    image: "/marine/pwc.webp",
    guidance:
      "Check rated seating with gear aboard, trailer package and storage. Two-rider and three-rider versions of a similarly named model can have different lengths and dry weights.",
  },
  jet: {
    label: "Jet boats",
    slug: "jet-boats",
    image: "/marine/jet.webp",
    guidance:
      "Compare engine count, loaded tow weight and low-speed handling. Confirm the exact trailer package and ask about access to the jet-pump cleanout.",
  },
  pontoon: {
    label: "Pontoons",
    slug: "pontoons",
    image: "/marine/pontoon.webp",
    guidance:
      "Compare actual deck layout, rated passengers, and dimensions. Ask whether the quoted package includes the trailer and which configuration was weighed.",
  },
} as const;
export type ShoppingCategory = keyof typeof categoryMap;

export type ShoppingRecord = CatalogRecord & {
  model: CatalogRecord["model"] & { category: ShoppingCategory };
  editorial: string;
  intendedUse: string;
};

export type ReviewRow = {
  brand: "sea-doo" | "yamaha-waverunner" | "yamaha-boats";
  family: string;
  trim: string;
  year: number;
  category: ShoppingCategory;
  url: string;
  priceUrl?: string;
  length: number;
  beam?: number;
  weight?: number;
  weightBasis?: string;
  capacity?: number;
  fuel?: number;
  hp?: number;
  engine: string;
  engines: number;
  displacement?: number;
  hull?: string;
  storage?: number;
  price?: number;
  includes?: string[];
  excludes?: string[];
  editorial: string;
  intendedUse: string;
};

const brands = {
  "sea-doo": {
    name: "Sea-Doo",
    url: "https://sea-doo.brp.com/us/en/models.html",
  },
  "yamaha-waverunner": {
    name: "Yamaha WaveRunner",
    url: "https://www.yamahawaverunners.com/",
  },
  "yamaha-boats": { name: "Yamaha Boats", url: "https://www.yamahaboats.com/" },
};
export const reviewDate = "2026-11-27";
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function normalizeReviewRow(row: ReviewRow): ShoppingRecord {
  const brand = brands[row.brand];
  const modelId = slugify(row.family);
  const yearId = `${row.brand}-${modelId}-${row.year}`;
  const variantId = `${yearId}-${slugify(row.trim)}`;
  const source: Source = {
    provider: brand.name,
    originalId: null,
    url: row.url,
    retrievedAt: reviewDate,
    verification: "verified",
    license: {
      status: "unknown",
      commercialDisplay: false,
      indexableDisplay: false,
      storage: "none",
      expiresAt: null,
      attribution: brand.name,
      restrictions: [
        "Independent factual review. Commercial reuse of source-derived records unresolved.",
      ],
    },
  };
  const obs = <T>(value: T | null, recordSource = source): Observation<T> => ({
    value,
    modelYear: row.year,
    source: recordSource,
  });
  const numeric = <U extends string>(amount: number | undefined, unit: U) =>
    obs(amount === undefined ? null : { amount, unit });
  return {
    manufacturer: {
      id: row.brand,
      name: brand.name,
      website: brand.url,
      mic: null,
      source: { ...source, url: brand.url },
    },
    model: {
      id: modelId,
      manufacturerId: row.brand,
      name: row.family,
      category: row.category,
      source,
    },
    modelYear: { id: yearId, modelId, year: row.year, market: "US", source },
    variant: {
      id: variantId,
      modelYearId: yearId,
      name: row.trim,
      source,
      specs: {
        length: numeric(row.length, "in"),
        beam: numeric(row.beam, "in"),
        draft: obs(null),
        dryWeight: numeric(row.weight, "lb"),
        dryWeightBasis: obs(row.weightBasis ?? null),
        passengers: numeric(row.capacity, "persons"),
        fuelCapacity: numeric(row.fuel, "US gal"),
        storageCapacity: numeric(row.storage, "US gal"),
        hullMaterial: obs(row.hull ?? null),
        engine: obs({
          type: "jet",
          count: row.engines,
          powerPerEngine:
            row.engines === 1 && row.hp ? { amount: row.hp, unit: "hp" } : null,
          fuel: "gasoline",
          name: row.engine,
          totalPower: row.hp ? { amount: row.hp, unit: "hp" } : null,
          displacement: row.displacement
            ? { amount: row.displacement, unit: "cc" }
            : null,
        }),
        performance: obs(null),
      },
      prices:
        row.price === undefined
          ? []
          : [
              obs(
                {
                  kind: "manufacturer-starting",
                  amount: row.price,
                  currency: "USD",
                  observedAt: reviewDate,
                  includedItems: row.includes ?? [],
                  excludedItems: row.excludes ?? [],
                },
                { ...source, url: row.priceUrl ?? row.url },
              ),
            ],
      images: [],
      recalls: [],
    },
    editorial: row.editorial,
    intendedUse: row.intendedUse,
  };
}

const isoDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(date)) &&
  new Date(date).toISOString().slice(0, 10) === date;
function https(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
export function validPrice(price: PriceObservation, asOf: string) {
  const value = price.value;
  if (
    !value ||
    value.currency !== "USD" ||
    !inRange(value.amount, limits.price) ||
    value.amount === 0 ||
    !isoDate(value.observedAt) ||
    !isoDate(asOf)
  )
    return false;
  const days = (Date.parse(asOf) - Date.parse(value.observedAt)) / 86_400_000;
  return days >= 0 && days <= 180;
}

export function startingPrice(
  record: ShoppingRecord,
  asOf = new Date().toISOString().slice(0, 10),
) {
  return (
    record.variant.prices
      .filter(
        (price) =>
          price.value?.kind === "manufacturer-starting" &&
          validPrice(price, asOf),
      )
      .sort((a, b) =>
        (b.value?.observedAt ?? "").localeCompare(a.value?.observedAt ?? ""),
      )[0]?.value ?? null
  );
}

function sources(record: ShoppingRecord) {
  return [
    record.manufacturer.source,
    record.model.source,
    record.modelYear.source,
    record.variant.source,
    ...Object.values(record.variant.specs).flatMap((observation) =>
      observation?.value == null ? [] : [observation.source],
    ),
    ...[
      ...record.variant.prices,
      ...record.variant.images,
      ...record.variant.recalls,
    ].flatMap((observation) =>
      observation.value == null ? [] : [observation.source],
    ),
  ];
}

export function validateCatalog(
  records: readonly ShoppingRecord[],
  asOf: string,
  { allowStale = false } = {},
) {
  const issues: string[] = [];
  const seen = new Map<string, ShoppingRecord>();
  for (const record of records) {
    const { variant, modelYear, editorial, intendedUse, model } = record;
    const id = variant.id;
    const previous = seen.get(id);
    if (previous) {
      issues.push(`${id}: duplicate identity`);
      if (
        JSON.stringify(
          Object.values(previous.variant.specs).map((item) => item.value),
        ) !==
        JSON.stringify(Object.values(variant.specs).map((item) => item.value))
      )
        issues.push(`${id}: conflicting specifications`);
    }
    seen.set(id, record);
    if (
      !recordsHaveConsistentIdentity(record) ||
      !/^[a-z0-9-]+$/.test(id) ||
      !/^[a-z0-9-]+$/.test(model.id) ||
      !/^[a-z0-9-]+$/.test(record.manufacturer.id) ||
      modelYear.market !== "US" ||
      modelYear.year < 1900 ||
      modelYear.year > Number(asOf.slice(0, 4)) + 2 ||
      !Object.hasOwn(categoryMap, model.category) ||
      !editorial.trim() ||
      !intendedUse.trim()
    )
      issues.push(`${id}: invalid identity or missing editorial`);
    if (
      sources(record).some(
        ({ url, retrievedAt, provider }) =>
          !https(url) ||
          !isoDate(retrievedAt) ||
          retrievedAt > asOf ||
          !provider.trim(),
      )
    )
      issues.push(`${id}: invalid source provenance`);
    for (const [name, observed] of Object.entries(variant.specs)) {
      const value = observed?.value;
      if (
        value &&
        typeof value === "object" &&
        "amount" in value &&
        (!Number.isFinite(value.amount) || value.amount <= 0)
      )
        issues.push(`${id}: invalid ${name}`);
    }
    if (
      !variant.specs.length.value ||
      !variant.specs.engine.value ||
      !hasEssentialSpecs(record)
    )
      issues.push(`${id}: missing essential specifications`);
    if (
      variant.prices.some(
        (price) =>
          price.value !== null &&
          (!validPrice(price, price.value.observedAt) ||
            price.value.observedAt > asOf ||
            (!allowStale && !validPrice(price, asOf))),
      )
    )
      issues.push(`${id}: invalid or stale price`);
    if (
      variant.images.some(
        ({ value }) =>
          value &&
          !/^\/marine\/[a-z0-9-]+\.(webp|avif|jpg|png)$/.test(value.path),
      )
    )
      issues.push(`${id}: invalid image path`);
  }
  return issues;
}

export function hasEssentialSpecs(record: ShoppingRecord) {
  const { length, beam, dryWeight, passengers, fuelCapacity } =
    record.variant.specs;
  return Boolean(
    length.value &&
    [beam, dryWeight, passengers, fuelCapacity].filter(
      (item) => item.value !== null,
    ).length >= 2,
  );
}

export function isPublishable(record: ShoppingRecord, asOf: string) {
  return (
    !validateCatalog([record], asOf, { allowStale: true }).length &&
    sources(record).every(
      (source) =>
        source.verification === "verified" &&
        source.license.storage === "persistent" &&
        canPublish(source, asOf, true),
    )
  );
}

export function lengthFeet(record: ShoppingRecord) {
  const value = record.variant.specs.length.value;
  if (!value) return null;
  return (
    value.amount * { ft: 1, in: 1 / 12, m: 3.28084, cm: 0.0328084 }[value.unit]
  );
}
export function horsepower(record: ShoppingRecord) {
  const engine = record.variant.specs.engine.value;
  const power = engine?.totalPower;
  return power ? power.amount * (power.unit === "kW" ? 1.341022 : 1) : null;
}

export type Budget = Parameters<typeof affordability>[0];
export const sampleTerms = {
  down: 20,
  downMode: "percent",
  annualRate: 7,
  months: 120,
} as const;
export function financeAtPrice(
  price: number,
  terms: Pick<Budget, "down" | "downMode" | "annualRate" | "months">,
) {
  const down = Math.min(
    price,
    downPaymentAmount(price, terms.down, terms.downMode),
  );
  return {
    down,
    loan: fixedLoan(price - down, terms.annualRate, terms.months),
  };
}
export function shoppingBudget(input: Budget) {
  return affordability(input);
}
export function costProjection(price: number, terms: Budget, resale?: number) {
  if (
    !inRange(price, limits.price) ||
    !inRange(terms.operating, limits.expense) ||
    (resale !== undefined && !inRange(resale, limits.price))
  )
    throw new RangeError("Check price, operating expenses and resale.");
  shoppingBudget(terms); // validates terms and acquisition inputs
  const { down, loan } = financeAtPrice(price, terms);
  const acquisition = (price * terms.taxRate) / 100 + terms.fees;
  const periodCash =
    down +
    acquisition +
    loan.monthly * Math.min(60, terms.months) +
    60 * terms.operating;
  const balance = remainingBalance(
    loan.principal,
    terms.annualRate,
    terms.months,
    60,
  );
  return {
    payment: loan.monthly,
    operating: terms.operating,
    monthly: loan.monthly + terms.operating,
    periodCash,
    balance,
    net: resale === undefined ? null : periodCash + balance - resale,
  };
}

export type Filters = {
  query?: string;
  brand?: string;
  category?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  minLength?: number;
  minHp?: number;
  passengers?: number;
  propulsion?: string;
  sort?: string;
};
export function filterCatalog(
  records: readonly ShoppingRecord[],
  filters: Filters,
  asOf: string,
  terms = sampleTerms as Pick<
    Budget,
    "down" | "downMode" | "annualRate" | "months"
  >,
) {
  const query = slugify(filters.query ?? "")
    .split("-")
    .filter(Boolean);
  const price = (boat: ShoppingRecord) =>
    startingPrice(boat, asOf)?.amount ?? Infinity;
  return records
    .filter((record) => {
      const name = slugify(
        `${record.manufacturer.name} ${record.model.name} ${record.variant.name} ${record.modelYear.year}`,
      );
      const { specs } = record.variant;
      return (
        query.every((word) => name.includes(word)) &&
        (!filters.brand || record.manufacturer.id === filters.brand) &&
        (!filters.category || record.model.category === filters.category) &&
        (!filters.year || record.modelYear.year === filters.year) &&
        (filters.minPrice === undefined ||
          (Number.isFinite(price(record)) &&
            price(record) >= filters.minPrice)) &&
        (filters.maxPrice === undefined || price(record) <= filters.maxPrice) &&
        (filters.minLength === undefined ||
          (lengthFeet(record) ?? -1) >= filters.minLength) &&
        (filters.minHp === undefined ||
          (horsepower(record) ?? -1) >= filters.minHp) &&
        (filters.passengers === undefined ||
          (specs.passengers.value?.amount ?? -1) >= filters.passengers) &&
        (!filters.propulsion || specs.engine.value?.type === filters.propulsion)
      );
    })
    .sort((a, b) => {
      const p = price(a),
        q = price(b);
      let order = 0;
      if (filters.sort === "price" || filters.sort === "payment") {
        const monthly = (amount: number) =>
          Number.isFinite(amount)
            ? financeAtPrice(amount, terms).loan.monthly
            : Infinity;
        order = filters.sort === "payment" ? monthly(p) - monthly(q) : p - q;
      } else if (filters.sort === "year")
        order = b.modelYear.year - a.modelYear.year;
      return order || a.variant.id.localeCompare(b.variant.id);
    });
}

export function similarBoats(
  record: ShoppingRecord,
  records: readonly ShoppingRecord[],
  asOf: string,
) {
  const price = startingPrice(record, asOf)?.amount;
  const length = lengthFeet(record);
  const hp = horsepower(record);
  const passengers = record.variant.specs.passengers.value?.amount;
  return records
    .filter(
      (candidate) =>
        candidate.model.category === record.model.category &&
        (candidate.model.id !== record.model.id ||
          candidate.manufacturer.id !== record.manufacturer.id),
    )
    .map((candidate) => {
      const reasons = ["Same boat type"];
      for (const [a, b, tolerance, reason] of [
        [
          price,
          startingPrice(candidate, asOf)?.amount,
          0.2,
          "Similar starting price",
        ],
        [length, lengthFeet(candidate), 0.12, "Similar length"],
        [hp, horsepower(candidate), 0.2, "Similar installed power"],
        [
          passengers,
          candidate.variant.specs.passengers.value?.amount,
          0.15,
          "Similar seating",
        ],
      ] as const)
        if (a && b && Math.abs(a - b) / a <= tolerance) reasons.push(reason);
      if (record.intendedUse === candidate.intendedUse)
        reasons.push("Similar intended use");
      if (
        record.variant.specs.engine.value?.type &&
        record.variant.specs.engine.value?.type ===
          candidate.variant.specs.engine.value?.type
      )
        reasons.push("Same propulsion");
      return { candidate, reasons };
    })
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length ||
        a.candidate.variant.id.localeCompare(b.candidate.variant.id),
    )
    .slice(0, 3);
}

export function validateComparison(
  ids: readonly string[],
  records: readonly ShoppingRecord[],
) {
  const known = new Set(records.map(({ variant }) => variant.id));
  return [
    ...new Set(
      ids.filter((id) => /^[a-z0-9-]{1,100}$/.test(id) && known.has(id)),
    ),
  ].slice(0, 3);
}

export const modelPath = (record: ShoppingRecord) =>
  `/boats/${record.manufacturer.id}/${record.model.id}`;
