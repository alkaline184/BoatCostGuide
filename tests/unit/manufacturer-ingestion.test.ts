import { expect, test } from "vitest";
import raw from "../../catalog/review.json";
import sun from "../../catalog/manufacturers/sun-tracker.json";
import kawasaki from "../../catalog/manufacturers/kawasaki.json";
import sea from "../../catalog/manufacturers/sea-doo.json";
import wave from "../../catalog/manufacturers/yamaha-waverunner.json";
import {
  adaptEditorialBatches,
  normalizedMeasurement,
} from "../../src/lib/marine/manufacturer-ingestion";
import {
  isPublishable,
  normalizeReviewRow,
  startingPrice,
  validateCatalog,
  type ReviewRow,
} from "../../src/lib/marine/shopping";

const date = "2026-11-27";
test("the current editorial batch integrates with the catalog and stays quarantined", () => {
  const result = adaptEditorialBatches(
    [sun, kawasaki, sea, wave],
    date,
    raw as ReviewRow[],
  );
  expect(result.rejected).toEqual([]);
  expect(result.rows).toHaveLength(29);
  const records = [...(raw as ReviewRow[]), ...result.rows].map(
    normalizeReviewRow,
  );
  expect(validateCatalog(records, date)).toEqual([]);
  expect(records.filter((row) => startingPrice(row, date))).toHaveLength(38);
  expect(records.some((row) => isPublishable(row, date))).toBe(false);
  const sunModel = records.find(
    (row) => row.manufacturer.id === "sun-tracker",
  )!;
  expect(sunModel.variant.specs.length.value).toEqual({
    amount: 221,
    unit: "in",
  });
  expect(sunModel.variant.specs.engine.value).toMatchObject({
    type: "outboard",
    totalPower: { amount: 20 },
  });
  const archive = records.find(
    (row) => row.manufacturer.id === "kawasaki" && row.modelYear.year === 2025,
  )!;
  expect(archive.variant.prices[0].value).toMatchObject({
    kind: "msrp",
    historical: true,
  });
  expect(startingPrice(archive, date)).toBeNull();
});

test("normalization rejects category unit errors, mismatched years and untrusted prices", () => {
  expect(
    normalizedMeasurement({ value: [21, 11], unit: "ft+in" }, "length"),
  ).toBe(263);
  expect(normalizedMeasurement({ value: 125, unit: "cm" }, "beam")).toBe(
    49.2126,
  );
  expect(() =>
    normalizedMeasurement({ value: [1, 12], unit: "ft+in" }, "length"),
  ).toThrow(/feet and inches/);
  const first = kawasaki.records[0];
  const badUnit = {
    ...first,
    checks: [],
    facts: { ...first.facts, length: { value: 130.3, unit: "ft" } },
  };
  const badYear = {
    ...first,
    evidence: { ...first.evidence, verifiedYear: 2026 },
  };
  const badPrice = { ...first, price: { ...first.price, kind: "promotional" } };
  const result = adaptEditorialBatches(
    [{ ...kawasaki, records: [badUnit, badYear, badPrice] }],
    date,
  );
  expect(result.rows).toEqual([]);
  expect(result.rejected.map((row) => row.reason)).toEqual([
    expect.stringMatching(/implausible/),
    expect.stringMatching(/model-year/),
    expect.stringMatching(/price/),
  ]);
});
test("duplicate normalized identities and conflicts are rejected", () => {
  const first = sun.records[0];
  const conflict = {
    ...first,
    checks: [],
    facts: { ...first.facts, length: { value: [19, 0], unit: "ft+in" } },
  };
  const result = adaptEditorialBatches(
    [{ ...sun, records: [first, first, conflict] }],
    date,
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rejected.map((row) => row.reason)).toEqual([
    "Duplicate identity",
    "Conflicting observation for existing identity",
  ]);
});

test("corroboration with a materially different source value requires editorial resolution", () => {
  const record = kawasaki.records[0];
  const checked = {
    ...record,
    checks: [
      {
        field: "length",
        observation: { value: 140, unit: "in" },
        url: record.evidence.url,
        year: record.model.year,
      },
    ],
  };
  const report = adaptEditorialBatches(
    [{ ...kawasaki, records: [checked] }],
    date,
  );
  expect(report.rows).toEqual([]);
  expect(report.rejected[0].reason).toMatch(/Conflicting length observations/);
});
