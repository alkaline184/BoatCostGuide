import { readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";

for (const name of [".env.local", ".env"]) {
  if (process.env.VEHDB_API_KEY) break;
  try {
    await loadEnvFile(name);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Cannot read local environment configuration.");
      process.exit(1);
    }
  }
}
const key = process.env.VEHDB_API_KEY;
if (!key) {
  console.error("VehDB evaluation skipped. VEHDB_API_KEY is unavailable.");
  process.exit(2);
}
const review = JSON.parse(
  await readFile(new URL("../catalog/review.json", import.meta.url), "utf8"),
);
const brands = [
  "Sea-Doo",
  "Yamaha",
  "Yamaha WaveRunner",
  "Kawasaki",
  "Scarab",
  "Sun Tracker",
  "Bennington",
];
const normal = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const fields = {
  length: ["length", "length_ft", "length_overall_ft"],
  beam: ["beam", "beam_ft", "width_ft"],
  weight: ["weight_lb", "dry_weight_lbs", "dry_weight_lb"],
  engines: ["engines", "engine_count"],
  hp: ["hp", "horsepower"],
  fuel: ["fuel_capacity_gallons", "fuel_capacity_gal"],
  capacity: ["passenger_capacity", "max_passengers"],
};
function numeric(record, keys) {
  for (const name of keys) {
    const value = record[name];
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    )
      return Number(value);
  }
  return null;
}
const summary = [];
for (const brand of brands) {
  // One bounded page per brand. No retries, redirects or raw payload logging.
  const url = new URL("https://api.vehdb.com/v1/boats");
  url.search = new URLSearchParams({ make: brand, per_page: "10" });
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      summary.push({ brand, status: response.status });
      if ([401, 403, 429].includes(response.status)) break;
      continue;
    }
    const body = await response.json();
    const rows = [body, body.data, body.results, body.boats]
      .find(Array.isArray)
      ?.slice(0, 10);
    if (!rows) {
      summary.push({ brand, status: "unrecognized response schema" });
      continue;
    }
    const sample = {
      brand,
      records: rows.length,
      reportedTotal: Number.isFinite(body.meta?.total) ? body.meta.total : null,
      rowsWithUpdateDate: 0,
      years: [],
      missingIdentity: 0,
      duplicates: 0,
      ambiguous: 0,
      exact: 0,
      missingPercent: {},
      crossChecks: {},
    };
    const identities = new Set();
    const years = new Set();
    const missing = Object.fromEntries(
      Object.keys(fields).map((field) => [field, 0]),
    );
    for (const boat of rows) {
      if (
        typeof boat.updated_at === "string" &&
        Number.isFinite(Date.parse(boat.updated_at))
      )
        sample.rowsWithUpdateDate++;
      const make = normal(boat.make ?? boat.manufacturer);
      const model = normal(boat.model);
      const trim = normal(boat.trim ?? boat.variant);
      const year = Number(boat.year ?? boat.model_year);
      for (const [field, aliases] of Object.entries(fields))
        if (numeric(boat, aliases) === null) missing[field]++;
      if (!make || !model || !year) {
        sample.missingIdentity++;
        continue;
      }
      years.add(year);
      const identity = [make, model, trim, year].join("/");
      if (identities.has(identity)) sample.duplicates++;
      identities.add(identity);
      const matches = review.filter(
        (row) =>
          (make === "seadoo"
            ? row.brand === "sea-doo"
            : make.startsWith("yamaha") && row.brand.startsWith("yamaha-")) &&
          normal(row.family) === model &&
          row.year === year,
      );
      const match = matches.find((row) => normal(row.trim) === trim);
      if (!match) {
        if (matches.length) sample.ambiguous++;
        continue;
      }
      sample.exact++;
      for (const [field, aliases] of Object.entries(fields)) {
        const provider = numeric(boat, aliases);
        const official = match[field];
        if (provider === null || official === undefined) continue;
        const base = ["length", "beam"].includes(field)
          ? official / 12
          : official;
        const entry = (sample.crossChecks[field] ??= {
          compared: 0,
          differing: 0,
        });
        entry.compared++;
        if (
          Math.abs(provider - base) >
          (["length", "beam"].includes(field) ? 0.1 : 0.01)
        )
          entry.differing++;
      }
    }
    sample.years = [...years].sort();
    sample.missingPercent = Object.fromEntries(
      Object.entries(missing).map(([field, count]) => [
        field,
        rows.length ? Math.round((count / rows.length) * 100) : null,
      ]),
    );
    summary.push(sample);
  } catch {
    summary.push({ brand, status: "request or response failed" });
  }
}
console.log(
  JSON.stringify({ checkedAt: new Date().toISOString(), summary }, null, 2),
);
