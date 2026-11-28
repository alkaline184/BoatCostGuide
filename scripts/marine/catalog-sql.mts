import { readFile } from "node:fs/promises";
import { manufacturerReview } from "../../src/lib/marine/manufacturer-review-server.ts";
import {
  isPublishable,
  normalizeReviewRow,
  type ShoppingRecord,
  validateCatalog,
} from "../../src/lib/marine/shopping.ts";

import { diagramFor } from "../../src/lib/marine/illustrations.ts";

const date = new Date().toISOString().slice(0, 10);
const review = await manufacturerReview(date);
const brand = process.argv
  .find((arg) => arg.startsWith("--manufacturer="))
  ?.slice(15);
const year = process.argv.find((arg) => arg.startsWith("--year="))?.slice(7);
const url = process.argv.find((arg) => arg.startsWith("--url="))?.slice(6);
const indexed = new Map(
  review.batches.flatMap(({ accepted }) =>
    accepted.map(({ row, original }) => [row, original] as const),
  ),
);
const rows = [...review.baseline, ...review.rows].filter(
  (row) =>
    (!brand || brand === row.brand) &&
    (!year || year === String(row.year)) &&
    (!url || url === row.url),
);
const candidates = rows.map((row) => {
  const fact = indexed.get(row)?.facts;
  const record = normalizeReviewRow(row);
  return {
    record,
    diagram: diagramFor(record),
    original: {
      length: fact?.length,
      beam: fact?.beam,
      dryWeight: fact?.weight,
      fuelCapacity: fact?.fuel,
      storageCapacity: fact?.storage,
    },
  };
});
const snapshot = JSON.parse(
  await readFile(
    new URL("../../catalog/approved.json", import.meta.url),
    "utf8",
  ),
) as ShoppingRecord[];
if (
  !Array.isArray(snapshot) ||
  validateCatalog(snapshot, date, { allowStale: true }).length ||
  snapshot.some((record) => !isPublishable(record, date))
) {
  throw new Error("Invalid approved catalog snapshot");
}
const approvedRows = snapshot.filter(
  (record) =>
    (!brand || record.manufacturer.id === brand) &&
    (!year || String(record.modelYear.year) === year) &&
    (!url || record.variant.source.url === url),
);
const byId = new Map(candidates.map((item) => [item.record.variant.id, item]));
for (const record of approvedRows) {
  const previous = byId.get(record.variant.id);
  byId.set(record.variant.id, {
    record,
    diagram: diagramFor(record),
    original: previous?.original ?? {
      length: undefined,
      beam: undefined,
      dryWeight: undefined,
      fuelCapacity: undefined,
      storageCapacity: undefined,
    },
  });
}
const payload = [...byId.values()];
const issues = validateCatalog(
  payload.map((item) => item.record),
  date,
  { allowStale: true },
);
if (issues.length || review.rejected.length || !payload.length) {
  console.error(
    JSON.stringify({
      issues,
      rejected: review.rejected,
      selected: payload.length,
    }),
  );
  process.exit(2);
}
if (!process.argv.includes("--emit-sql")) {
  console.log(
    JSON.stringify(
      {
        selected: payload.length,
        requests: 0,
        approvedSnapshotRows: approvedRows.length,
        publishedByImport: 0,
        mode: "dry-run",
      },
      null,
      2,
    ),
  );
} else {
  const serialized = Buffer.from(JSON.stringify(payload)).toString("hex");
  console.log(
    `begin; select marine.import_catalog(convert_from(decode('${serialized}','hex'),'UTF8')::jsonb); commit;`,
  );
}
