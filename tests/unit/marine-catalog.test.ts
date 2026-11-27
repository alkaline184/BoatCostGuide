import { describe, expect, it } from "vitest";
import {
  canPublish,
  formatObservation,
  recordsHaveConsistentIdentity,
  type CatalogRecord,
  type Source,
} from "../../src/lib/marine/catalog";
import { projectFiveYears } from "../../src/lib/marine/scenario";
import { fixtures } from "../../src/components/research/catalog-fixtures";

describe("marine catalog boundary", () => {
  it("retains source attribution and null values with their model year", () => {
    expect(fixtures.every(recordsHaveConsistentIdentity)).toBe(true);
    expect(formatObservation(fixtures[0].variant.specs.draft)).toBe(
      "Unavailable",
    );
    expect(formatObservation(fixtures[0].variant.specs.length)).toBe("24 ft");
    const copy = structuredClone(fixtures[0]) as CatalogRecord;
    copy.modelYear.year = 2028;
    expect(recordsHaveConsistentIdentity(copy)).toBe(false);
  });
  it("requires current commercial and indexable rights and rejects fixtures", () => {
    const fixture = fixtures[0].variant.source;
    const source: Source = {
      ...fixture,
      verification: "verified",
      license: {
        ...fixture.license,
        status: "approved",
        commercialDisplay: true,
        indexableDisplay: false,
        expiresAt: "2027-02-01",
      },
    };
    expect(canPublish(fixture, "2026-11-27")).toBe(false);
    expect(canPublish(source, "2026-11-27")).toBe(true);
    expect(canPublish(source, "2026-11-27", true)).toBe(false);
    expect(canPublish(source, "2027-02-01")).toBe(false);
  });
});
describe("prototype finance assumptions", () => {
  it("uses the shared fixed-rate payment and remaining balance", () => {
    const data = projectFiveYears({
      price: 45000,
      downPercent: 20,
      annualRate: 7,
      years: 10,
      operating: 350,
    });
    expect(data.monthlyPayment).toBeCloseTo(417.990525, 6);
    expect(data.remainingBalance).toBeCloseTo(21109.3547865, 6);
    expect(data.periodCashOutflow).toBeCloseTo(55079.43151, 4);
  });
  it("stops payments at maturity and rejects invalid assumptions", () => {
    expect(
      projectFiveYears({
        price: 20000,
        downPercent: 0,
        annualRate: 0,
        years: 2,
        operating: 100,
      }),
    ).toMatchObject({ remainingBalance: 0, periodCashOutflow: 26000 });
    expect(() =>
      projectFiveYears({
        price: 20000,
        downPercent: 101,
        annualRate: 0,
        years: 2,
        operating: 100,
      }),
    ).toThrow();
  });
});
