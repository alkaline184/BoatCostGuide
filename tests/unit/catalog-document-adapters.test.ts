import { describe, expect, it } from "vitest";
import {
  documentBatch,
  type DocumentProfile,
} from "../../scripts/marine/document-adapters.mts";
import { adaptEditorialBatches } from "../../src/lib/marine/manufacturer-ingestion";

const model = {
  family: "Synthetic Craft",
  trim: "Demo Trim",
  year: 2027,
  market: "US" as const,
  category: "pwc" as const,
};
const profile: DocumentProfile = {
  adapter: "kawasaki-sheet",
  observedAt: "2026-11-27",
  model,
  evidence: {
    url: "https://www.kawasaki.com/en-us/products/ProductSpecSheetPDF/test-fixture",
    yearUrl:
      "https://www.kawasaki.com/en-us/products/ProductSpecSheetPDF/test-fixture",
    verifiedYear: 2027,
  },
  power: { name: "Fixture engine", count: 1, type: "jet" },
  intendedUse: "Synthetic test intended use",
  editorial: "Synthetic test editorial, never a catalog observation.",
};
const sheet = `2027 Synthetic Craft Demo Trim
Overall Length: 125 in
Overall Width: 45 in
Estimated Dry Weight: 800 lb
Fuel Capacity: 16 US gal
Seating Capacity: 3
MSRP: $12,399`;

describe("owner-supplied manufacturer documents", () => {
  it("extracts exact-year Kawasaki raw units and an MSRP proposal", () => {
    const batch = documentBatch(profile, sheet);
    expect(batch.records[0].facts.length).toEqual({ value: 125, unit: "in" });
    expect(batch.records[0].price).toMatchObject({
      amount: 12399,
      kind: "msrp",
      currency: "USD",
    });
    expect(adaptEditorialBatches([batch], profile.observedAt).rejected).toEqual(
      [],
    );
  });

  it("keeps Sun Tracker deck width and package price distinct", () => {
    const url = "https://www.suntrackerboats.com/test-fixture.html";
    const batch = documentBatch(
      {
        ...profile,
        adapter: "sun-tracker-specification",
        model: { ...model, category: "pontoon" },
        evidence: { url, yearUrl: url, verifiedYear: 2027 },
        power: { type: "outboard", count: 1, name: "Fixture outboard" },
      },
      `2027 Synthetic Craft Demo Trim
Length: 20 ft 3 in
Deck Width: 100 in
Average Dry Weight: 1,500 lb
Fuel Capacity: 20 gal
Max. Person Capacity: 8
National Base Price: $19,999`,
    );
    expect(batch.records[0].facts.length).toEqual({
      value: [20, 3],
      unit: "ft+in",
    });
    expect(batch.records[0]).toMatchObject({
      widthBasis: "Deck width",
      price: { label: "National base package price" },
    });
    expect(adaptEditorialBatches([batch], profile.observedAt).rejected).toEqual(
      [],
    );
  });

  it("fails without confirmed identity or if a required value conflicts", () => {
    expect(() => documentBatch(profile, sheet.replace("2027", "2025"))).toThrow(
      "exact year",
    );
    expect(() =>
      documentBatch(profile, sheet + "\nOverall Length: 140 in"),
    ).toThrow("conflicting");
  });
});
