import { identity, type OemFacts } from "./enrichment";

type FactValues = {
  length: number | null;
  metricLength: number | null;
  beam: number | null;
  dryWeight: number | null;
  displacement: number | null;
  passenger: number | null;
  horsepower: number | null;
  engineCount: number | null;
  fuel: number | null;
  fuelShape: string;
  fuelUnit?: string | null;
  expandedFieldsChecked?: boolean;
  unit: string | null;
  date: string | null;
  basis: string | null;
};
type PhotoMetadata = {
  primary: boolean;
  gallery: number;
  width: number | null;
  height: number | null;
  alt: boolean;
  credit: boolean;
};
export type Candidate = {
  id: string;
  first: number | null;
  last: number | null;
  reference: { amount: number; currency: string } | null;
  facts: FactValues | null;
  media: PhotoMetadata | null;
};
export type AuditTarget = {
  maker: string;
  model: string;
  targetYear: number;
  category: string;
  classification: "approximate" | "ambiguous" | "missing";
  confidence: string;
  source: string;
  matches: Candidate[];
};
export type ProviderAudit = {
  date: string;
  complete: boolean;
  error?: string;
  usage: {
    completionRequests: number;
    successful: number;
    failed: number;
    remaining: number | null;
    quota: number | null;
    rate: number | null;
    skippedRows: number;
  };
  totals: Record<string, number>;
  years: Record<string, number>;
  sample: Record<string, number>;
  makers: Array<{
    name: string;
    all: number;
    recent: number | null;
    cohort: string;
  }>;
  cohorts: Record<
    string,
    {
      size: number;
      makers: number;
      primary: number;
      priced: number;
      usd: number;
      newestStart: number | null;
    }
  >;
  benchmark: AuditTarget[];
  anomalies: Array<{
    id: string;
    model: string;
    version: string | null;
    lengthSummaryMetres: number | null;
    facts: FactValues;
  }>;
};
export type PhotoAudit = {
  number: number;
  id: string;
  category: string;
  loaded: boolean;
  usable: boolean;
  duplicate: boolean;
  primary: boolean;
  gallery: number;
  width: number;
  height: number;
  alt: boolean;
  credit: boolean;
};
export type PhotoNotes = Record<
  string,
  {
    classification:
      "identifiable" | "family-only" | "conflicting" | "generic" | "uncertain";
    watermark: boolean;
    note?: string;
  }
>;

export const coreFields = [
  "length",
  "beam",
  "dryWeight",
  "horsepower",
  "engineCount",
  "passenger",
  "fuel",
] as const;
type CoreField = (typeof coreFields)[number];
type Check = {
  field: CoreField;
  status: "missing" | "correct" | "incorrect" | "ambiguous";
  observed: number | null;
  expected: number | null;
  units: string;
};

const tolerances: Record<CoreField, number> = {
  length: 1,
  beam: 1,
  dryWeight: 5,
  horsepower: 1,
  engineCount: 0,
  passenger: 0,
  fuel: 0.25,
};
const expectedKeys = {
  length: "lengthIn",
  beam: "beamIn",
  dryWeight: "dryWeightLb",
  horsepower: "horsepower",
  engineCount: "engineCount",
  passenger: "passenger",
  fuel: "fuelUsGal",
} as const;
const unitLabels = {
  length: "in",
  beam: "in",
  dryWeight: "lb",
  horsepower: "hp",
  engineCount: "engines",
  passenger: "people",
  fuel: "US gal",
} as const;

export function compareSpecifications(
  target: AuditTarget,
  candidate: Candidate,
  oem?: OemFacts,
): Check[] {
  const facts = candidate.facts;
  return coreFields.map((field) => {
    const raw = facts?.[field] ?? null;
    const expected = oem?.[expectedKeys[field]] ?? null;
    const imperial = facts?.unit === "imperial";
    const metric = facts?.unit === "metric";
    let observed = raw;
    // Metric length is explicit in the API, independently of the raw display unit.
    if (field === "length")
      observed =
        facts?.metricLength != null
          ? facts.metricLength / 0.0254
          : raw === null
            ? null
            : metric
              ? raw / 0.0254
              : imperial
                ? raw * 12
                : null;
    if (field === "beam")
      observed =
        raw === null
          ? null
          : metric
            ? raw / 0.0254
            : imperial
              ? raw * 12
              : null;
    if (field === "dryWeight")
      observed =
        raw === null || (!imperial && !metric)
          ? null
          : metric
            ? raw * 2.2046226218
            : raw;
    // A volume with no explicit unit cannot be equated to US gallons.
    if (field === "fuel") {
      observed =
        raw === null
          ? null
          : /^(us gal|us gallon|us gallons)$/.test(facts?.fuelUnit ?? "")
            ? raw
            : /^(l|liter|liters|litre|litres)$/.test(facts?.fuelUnit ?? "")
              ? raw / 3.785411784
              : null;
    }
    const present = raw !== null || (field === "length" && observed !== null);
    const sameStart = candidate.first !== null && candidate.first === oem?.year;
    const status = !present
      ? "missing"
      : observed === null ||
          expected === null ||
          !sameStart ||
          target.classification === "ambiguous" ||
          field === "dryWeight"
        ? "ambiguous"
        : Math.abs(observed - expected) <= tolerances[field]
          ? "correct"
          : "incorrect";
    return { field, status, observed, expected, units: unitLabels[field] };
  });
}
export function evaluateBenchmark(
  audit: ProviderAudit,
  oem: readonly OemFacts[],
) {
  const results = audit.benchmark.map((target) => {
    const official = oem.find(
      (row) =>
        row.year === target.targetYear &&
        identity(row.maker) === identity(target.maker) &&
        identity(row.model) === identity(target.model),
    );
    return {
      ...target,
      official,
      candidates: target.matches.map((candidate) => {
        const baseline = oem.find(
          (row) =>
            row.year === candidate.first &&
            identity(row.maker) === identity(target.maker) &&
            identity(row.model) === identity(target.model),
        );
        return {
          ...candidate,
          baseline,
          checks: compareSpecifications(target, candidate, baseline),
        };
      }),
    };
  });
  const candidates = results.flatMap((row) => row.candidates);
  const checks = candidates.flatMap((row) => row.checks);
  const count = (status: Check["status"]) =>
    checks.filter((row) => row.status === status).length;
  return {
    results,
    candidates,
    applicable: checks.length,
    missing: count("missing"),
    correct: count("correct"),
    incorrect: count("incorrect"),
    ambiguous: count("ambiguous"),
    unique: results.filter((row) => row.classification === "approximate")
      .length,
    matched: results.filter((row) => row.matches.length).length,
    exact: 0,
    weightedCompleteness: results.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          ...row.candidates.map(
            (candidate) =>
              candidate.checks.filter((check) => check.status !== "missing")
                .length,
          ),
        ),
      0,
    ),
    pricedTargets: results.filter((row) =>
      row.matches.some((match) => match.reference),
    ).length,
    usdTargets: results.filter((row) =>
      row.matches.some((match) => match.reference?.currency === "USD"),
    ).length,
  };
}
