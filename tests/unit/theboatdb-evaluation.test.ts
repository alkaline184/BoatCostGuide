import { expect, test } from "vitest";
import {
  compareSpecifications,
  evaluateBenchmark,
  type AuditTarget,
  type Candidate,
  type ProviderAudit,
} from "../../src/lib/marine/evaluation/metrics";
import {
  gtx2025,
  loadOemFacts,
} from "../../src/lib/marine/evaluation/enrichment";

const target: AuditTarget = {
  maker: "Sea Doo",
  model: "GTX 170",
  targetYear: 2025,
  category: "PWC",
  classification: "approximate",
  confidence: "Production start",
  source: gtx2025.source,
  matches: [],
};
const candidate: Candidate = {
  id: "sample-only",
  first: 2025,
  last: null,
  reference: { amount: 15399, currency: "USD" },
  media: null,
  facts: {
    length: 11.33,
    metricLength: 3.453384,
    beam: 4.1,
    dryWeight: null,
    displacement: 776,
    passenger: null,
    horsepower: 170,
    engineCount: 1,
    fuel: 18.5,
    fuelShape: "number",
    unit: "imperial",
    date: null,
    basis: null,
  },
};
test("audit converts declared dimensions and leaves untyped fuel and displacement out of verified accuracy", () => {
  const checks = compareSpecifications(target, candidate, gtx2025);
  expect(
    Object.fromEntries(checks.map((check) => [check.field, check.status])),
  ).toEqual({
    length: "correct",
    beam: "correct",
    dryWeight: "missing",
    horsepower: "correct",
    engineCount: "correct",
    passenger: "missing",
    fuel: "ambiguous",
  });
  expect(
    compareSpecifications(target, { ...candidate, first: 2024 }, gtx2025).find(
      (check) => check.field === "length",
    )?.status,
  ).toBe("ambiguous");
});
test("missing and ambiguous targets remain in the benchmark with separate record denominators", () => {
  const audit = {
    benchmark: [
      { ...target, matches: [candidate] },
      { ...target, model: "Absent", classification: "missing" },
      {
        ...target,
        classification: "ambiguous",
        matches: [candidate, { ...candidate, id: "second" }],
      },
    ],
  } as ProviderAudit;
  const report = evaluateBenchmark(audit, [gtx2025]);
  expect(report.results).toHaveLength(3);
  expect(report.matched).toBe(2);
  expect(report.exact).toBe(0);
  expect(report.applicable).toBe(21);
  expect(report.missing).toBe(6);
  expect(report.weightedCompleteness).toBe(10);
  expect(report.correct).toBe(4);
  expect(report.ambiguous).toBe(11);
});
test("manufacturer pilot keeps source, market-year context and price basis independently", async () => {
  const { enrichmentPilot } = await loadOemFacts();
  expect(enrichmentPilot).toHaveLength(10);
  expect(
    enrichmentPilot.every(
      (row) =>
        row.source.startsWith("https://") && row.priceUsd && row.priceBasis,
    ),
  ).toBe(true);
  expect(
    enrichmentPilot.find((row) => row.year === 2025)?.priceBasis,
  ).toContain("Archived");
});

test("expanded field parser preserves unit ambiguity and accepts typed numeric strings", async () => {
  const { readExpandedFields } =
    await import("../../src/lib/marine/evaluation/provider-fields");
  expect(
    readExpandedFields({
      engines: [{ power: "170", powerType: "HP" }, { power: "170 hp" }],
      tanks: { fuel: ["70"] },
    }),
  ).toMatchObject({ horsepower: 340, fuel: 70, fuelUnit: null });
  expect(
    readExpandedFields({
      engines: [{ power: "170 kW", powerType: "HP" }],
      tanks: { fuel: [{ capacity: "70", unit: "L" }] },
    }),
  ).toMatchObject({ horsepower: null, fuel: 70, fuelUnit: "l" });
  expect(readExpandedFields({ tanks: { fuel: [25, 50] } }).fuel).toBeNull();
});
