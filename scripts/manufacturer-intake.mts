import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  adaptEditorialBatches,
  reviewIdentity,
} from "../src/lib/marine/manufacturer-ingestion.ts";
import type { ReviewRow } from "../src/lib/marine/shopping.ts";

const root = "catalog";
const directory = join(root, "manufacturers");
const args = process.argv.slice(2);
const known = new Set(["--proposal"]);
if (args.some((arg) => !known.has(arg))) {
  console.error("Usage: npm run catalog:intake -- [--proposal]");
  process.exit(1);
}
const clock = performance.now();
const baseline = JSON.parse(
  await readFile(join(root, "review.json"), "utf8"),
) as ReviewRow[];
const files = (await readdir(directory))
  .filter((file) => /^[a-z-]+\.json$/.test(file))
  .sort();
const inputs = await Promise.all(
  files.map(
    async (file) =>
      JSON.parse(await readFile(join(directory, file), "utf8")) as unknown,
  ),
);
const today = new Date().toISOString().slice(0, 10);
const report = adaptEditorialBatches(inputs, today, baseline);
if (report.rejected.length) {
  console.error(JSON.stringify(report.rejected, null, 2));
  process.exit(2);
}
if (args.includes("--proposal")) {
  console.log(
    JSON.stringify(
      {
        status: "publication-clearance-required",
        additions: report.rows.map((row) => ({
          identity: reviewIdentity(row),
          row,
        })),
      },
      null,
      2,
    ),
  );
} else {
  const rows = [...baseline, ...report.rows];
  const group = (key: "brand" | "year") =>
    Object.fromEntries(
      [...new Set(rows.map((row) => row[key]))]
        .sort()
        .map((value) => [
          value,
          rows.filter((row) => row[key] === value).length,
        ]),
    );
  const present = [
    "length",
    "beam",
    "weight",
    "capacity",
    "fuel",
    "hp",
    "displacement",
    "storage",
    "hull",
  ] as const;
  console.log(
    JSON.stringify(
      {
        variants: rows.length,
        manufacturers: group("brand"),
        modelYears: group("year"),
        priced: rows.filter((row) => row.price !== undefined).length,
        historicalPrices: rows.filter((row) => row.historicalPrice).length,
        stalePrices: rows.filter(
          (row) =>
            row.price !== undefined &&
            !row.historicalPrice &&
            (Date.parse(today) - Date.parse(row.observedAt ?? "2026-11-27")) /
              86_400_000 >
              180,
        ).length,
        crossChecks: report.batches.reduce(
          (total, { batch }) =>
            total +
            batch.records.reduce(
              (subtotal, record) => subtotal + (record.checks?.length ?? 0),
              0,
            ),
          0,
        ),
        missing: Object.fromEntries(
          present.map((key) => [
            key,
            rows.filter((row) => row[key] === undefined).length,
          ]),
        ),
        batches: report.batches.map(({ batch, accepted }) => ({
          brand: batch.brand,
          submitted: batch.records.length,
          accepted: accepted.length,
          priced: accepted.filter(({ row }) => row.price !== undefined).length,
        })),
        reviewOnly: report.rows.length,
        elapsedMs: Math.round((performance.now() - clock) * 10) / 10,
      },
      null,
      2,
    ),
  );
}
