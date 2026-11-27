import type { CatalogRecord, Observation, Source } from "@/lib/marine/catalog";

const source: Source = {
  provider: "BoatCostGuide development fixture",
  originalId: null,
  url: "http://localhost:3006/research-preview/model",
  retrievedAt: "2026-11-27",
  verification: "fixture",
  license: {
    status: "restricted",
    commercialDisplay: false,
    indexableDisplay: false,
    storage: "none",
    expiresAt: null,
    attribution: null,
    restrictions: ["Local interface review only"],
  },
};

function fixture(
  category: CatalogRecord["model"]["category"],
  name: string,
  length: number,
  beam: number,
  weight: number,
  power: number,
  passengers: number,
  image: string,
): CatalogRecord {
  const modelYear = 2027;
  const observed = <T>(value: T | null): Observation<T> => ({
    value,
    modelYear,
    source,
  });
  return {
    manufacturer: {
      id: "demo",
      name: "Demo Marine",
      website: null,
      mic: null,
      source,
    },
    model: { id: category, manufacturerId: "demo", category, name, source },
    modelYear: {
      id: category + "-2027",
      modelId: category,
      year: modelYear,
      market: "US",
      source,
    },
    variant: {
      id: category + "-standard",
      modelYearId: category + "-2027",
      name: "Standard",
      source,
      specs: {
        length: observed({ amount: length, unit: "ft" }),
        beam: observed({ amount: beam, unit: "ft" }),
        draft: observed(null),
        dryWeight: observed({ amount: weight, unit: "lb" }),
        fuelCapacity: observed(null),
        performance: observed(null),
        passengers: observed({ amount: passengers, unit: "persons" }),
        engine: observed({
          type: "outboard",
          count: 1,
          powerPerEngine: { amount: power, unit: "hp" },
          fuel: "gasoline",
        }),
      },
      prices: [],
      images: [
        observed({
          path: image,
          alt: "",
          role: "category-illustration",
          credit: "Generated category illustration",
        }),
      ],
      recalls: [],
    },
  };
}

export const fixtures = [
  fixture(
    "center-console",
    "Harbor 24",
    24,
    8.5,
    4200,
    250,
    8,
    "/marine/center-console.webp",
  ),
  fixture("pontoon", "Cove 22", 22, 8.5, 2700, 150, 10, "/marine/pontoon.webp"),
  fixture("bass", "Marsh 19", 19, 8, 1900, 175, 4, "/marine/bass.webp"),
];
