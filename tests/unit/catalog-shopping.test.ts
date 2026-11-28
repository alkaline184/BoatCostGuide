import { expect, test } from "vitest";
import approved from "../../catalog/approved.json";
import raw from "../../catalog/review.json";
import {
  costProjection,
  filterCatalog,
  financeAtPrice,
  hasEssentialSpecs,
  isPublishable,
  modelPath,
  normalizeReviewRow,
  reviewDate,
  sampleTerms,
  shoppingBudget,
  similarBoats,
  startingPrice,
  validateCatalog,
  validateComparison,
  type ReviewRow,
  type ShoppingRecord,
} from "../../src/lib/marine/shopping";

const records = (raw as ReviewRow[]).map(normalizeReviewRow);
const published = approved as unknown as ShoppingRecord[];
const [first, second] = records;
const validationDate = process.env.BOAT_CATALOG_VALIDATE
  ? new Date().toISOString().slice(0, 10)
  : reviewDate;

test("review catalog validates identities and every factual source", () => {
  expect(records.length).toBeGreaterThanOrEqual(20);
  expect(validateCatalog(records, validationDate)).toEqual([]);
  expect(validateCatalog(published, validationDate)).toEqual([]);
  expect(published.every((record) => isPublishable(record, reviewDate))).toBe(
    true,
  );
  expect(records.some((record) => isPublishable(record, reviewDate))).toBe(
    false,
  );
  const cleared = structuredClone(first);
  const license = {
    status: "approved",
    commercialDisplay: true,
    indexableDisplay: true,
    storage: "persistent",
    expiresAt: "2027-03-01",
  };
  Object.assign(cleared.manufacturer.source.license, license);
  Object.assign(cleared.variant.source.license, license);
  expect(isPublishable(cleared, reviewDate)).toBe(true);
  expect(isPublishable(cleared, "2027-03-01")).toBe(false);
  const invalid = structuredClone(first);
  Object.assign(invalid.variant.source, { url: "http://invalid.test" });
  Object.assign(invalid.variant.specs.length, { value: null });
  expect(validateCatalog([invalid], reviewDate).join()).toMatch(
    /provenance.*essential/,
  );
});

test("duplicate conflicting observations, invalid prices and stale prices are detected", () => {
  const conflicting = structuredClone(first);
  Object.assign(conflicting.variant.specs.length.value!, { amount: 999 });
  expect(validateCatalog([first, conflicting], reviewDate).join()).toMatch(
    /duplicate.*conflicting/,
  );
  const priced = records.find((record) => startingPrice(record, reviewDate))!;
  const invalid = structuredClone(priced);
  Object.assign(invalid.variant.prices[0].value!, { amount: 0 });
  expect(validateCatalog([invalid], reviewDate).join()).toMatch(/price/);
  expect(startingPrice(priced, "2028-01-01")).toBeNull();
  expect(validateCatalog([priced], "2028-01-01").join()).toMatch(/stale/);
  expect(validateCatalog([priced], "2028-01-01", { allowStale: true })).toEqual(
    [],
  );
});

test("search and filters preserve missing prices and combine strict criteria", () => {
  expect(
    filterCatalog(records, { query: "sea doo spark" }, reviewDate),
  ).toHaveLength(3);
  expect(
    filterCatalog(records, { query: "spark", year: 2026 }, reviewDate),
  ).toHaveLength(1);
  expect(
    filterCatalog(records, { query: "spark", maxPrice: 10000 }, reviewDate),
  ).toEqual([]);
  const filtered = filterCatalog(
    records,
    { brand: "yamaha-boats", category: "jet", minLength: 18, minPrice: 1 },
    reviewDate,
  );
  expect(filtered.length).toBeGreaterThanOrEqual(2);
  expect(filtered.every((record) => startingPrice(record, reviewDate))).toBe(
    true,
  );
});

test("real comparisons and similar boats are deterministic", () => {
  expect(
    validateComparison(
      [first.variant.id, first.variant.id, "bogus", second.variant.id],
      records,
    ),
  ).toEqual([first.variant.id, second.variant.id]);
  const similar = similarBoats(first, records, reviewDate);
  expect(similar.length).toBeGreaterThan(0);
  expect(
    similar.every(
      ({ candidate, reasons }) =>
        modelPath(candidate) !== modelPath(first) &&
        reasons.includes("Same boat type"),
    ),
  ).toBe(true);
});

test("budget matching and cash flow agree with the shared finance engine", () => {
  const terms = {
    ...sampleTerms,
    annualRate: 0,
    months: 60,
    budget: 400,
    operating: 100,
    fees: 100,
    taxRate: 0,
  };
  const scenario = costProjection(20000, terms, 10000);
  expect(scenario.payment).toBe(financeAtPrice(20000, terms).loan.monthly);
  expect(scenario.monthly).toBeCloseTo((20000 * 0.8) / 60 + 100);
  expect(scenario.periodCash).toBeCloseTo(26100);
  expect(scenario.net).toBeCloseTo(16100);
  expect(shoppingBudget(terms)).toBeDefined();
});

test("catalog quality summary", () => {
  expect(records.every(hasEssentialSpecs)).toBe(true);
  if (!process.env.BOAT_CATALOG_REPORT) return;
  console.log(
    JSON.stringify(
      {
        families: new Set(records.map(modelPath)).size,
        variants: records.length,
        manufacturers: [
          ...new Set(records.map(({ manufacturer }) => manufacturer.name)),
        ],
        years: [...new Set(records.map(({ modelYear }) => modelYear.year))],
        priced: records.filter((record) => startingPrice(record, reviewDate))
          .length,
        images: records.filter((record) => record.variant.images.length).length,
        eligible: published.filter((record) =>
          isPublishable(record, reviewDate),
        ).length,
        missing: Object.fromEntries([
          ...Object.keys(first.variant.specs).map((key) => [
            key,
            records.filter(
              ({ variant }) =>
                variant.specs[key as keyof typeof variant.specs]?.value == null,
            ).length,
          ]),
          [
            "installedHorsepower",
            records.filter(
              ({ variant }) => variant.specs.engine.value?.totalPower == null,
            ).length,
          ],
          [
            "displacement",
            records.filter(
              ({ variant }) => variant.specs.engine.value?.displacement == null,
            ).length,
          ],
        ]),
      },
      null,
      2,
    ),
  );
});
