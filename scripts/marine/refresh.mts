import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  adaptEditorialBatches,
  reviewIdentity,
} from "../../src/lib/marine/manufacturer-ingestion.ts";
import { manufacturerReview } from "../../src/lib/marine/manufacturer-review-server.ts";
import {
  normalizeReviewRow,
  type ReviewRow,
} from "../../src/lib/marine/shopping.ts";
import { documentBatch, type DocumentProfile } from "./document-adapters.mts";
import { diagramFor } from "../../src/lib/marine/illustrations.ts";

const started = performance.now();
const [command, input, profilePath] = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);
const review = await manufacturerReview(today);
const flag = (name: string) =>
  process.argv
    .find((arg) => arg.startsWith(name + "="))
    ?.slice(name.length + 1);
const manufacturer = flag("--manufacturer");
const model = flag("--model");
const current = [...review.baseline, ...review.rows].filter(
  (row) =>
    (!manufacturer || row.brand === manufacturer) &&
    (!model || row.family.toLowerCase() === model.toLowerCase()),
);
if (command === "discover" || command === "stale") {
  console.log(
    JSON.stringify(
      {
        requests: 0,
        records: current
          .filter(
            (row) =>
              command === "discover" ||
              !row.observedAt ||
              Date.parse(today) - Date.parse(row.observedAt) > 180 * 86400000,
          )
          .map((row) => ({
            identity: reviewIdentity(row),
            source: row.url,
            observedAt: row.observedAt,
          })),
      },
      null,
      2,
    ),
  );
} else if ((command === "document" || command === "compare") && input) {
  const source = await readFile(input);
  if (source.length > 20 * 1024 * 1024) throw new Error("Input exceeds 20 MB");
  const batch =
    command === "document"
      ? documentBatch(
          JSON.parse(await readFile(profilePath, "utf8")) as DocumentProfile,
          input.toLowerCase().endsWith(".pdf")
            ? execFileSync("pdftotext", ["-layout", "-nopgbrk", input, "-"], {
                encoding: "utf8",
                timeout: 10000,
                maxBuffer: 2000000,
              })
            : source.toString("utf8"),
        )
      : (JSON.parse(source.toString("utf8")) as unknown);
  const { batches, rejected } = adaptEditorialBatches(
    Array.isArray(batch) ? batch : [batch],
    today,
  );
  if (rejected.length) {
    console.error(JSON.stringify({ rejected, requests: 0 }));
    process.exit(2);
  }
  const prior = new Map(current.map((row) => [reviewIdentity(row), row]));
  const specFields = [
    "length",
    "beam",
    "weight",
    "hp",
    "capacity",
    "fuel",
    "storage",
    "displacement",
    "engine",
    "engines",
    "widthBasis",
    "weightBasis",
  ] as const;
  const priceFields = [
    "price",
    "priceKind",
    "priceLabel",
    "historicalPrice",
    "includes",
    "excludes",
  ] as const;
  const changed = (
    a: ReviewRow,
    b: ReviewRow,
    keys: readonly (keyof ReviewRow)[],
  ) =>
    keys.filter(
      (key) =>
        a[key] !== undefined &&
        JSON.stringify(a[key]) !== JSON.stringify(b[key]),
    );
  const approved = new Set(
    process.argv
      .filter((arg) => arg.startsWith("--approve="))
      .map((arg) => arg.slice(10)),
  );
  const proposals = batches.flatMap(({ accepted }) =>
    accepted.flatMap(({ row, original }) => {
      if (
        (manufacturer && row.brand !== manufacturer) ||
        (model && row.family.toLowerCase() !== model.toLowerCase())
      )
        return [];
      const identity = reviewIdentity(row);
      const previous = prior.get(identity);
      const type: string[] = [];
      const missing = previous
        ? [...specFields, ...priceFields].filter(
            (key) => previous[key] !== undefined && row[key] === undefined,
          )
        : [];
      if (missing.length) type.push("missing-observations");
      if (!previous) {
        const family = current.filter(
          (item) => item.brand === row.brand && item.family === row.family,
        );
        type.push(
          !family.length
            ? "new-family"
            : family.some((item) => item.year === row.year)
              ? "new-variant"
              : "new-model-year",
        );
      } else {
        if (changed(row, previous, priceFields).length)
          type.push("price-change");
        if (changed(row, previous, specFields).length)
          type.push(
            row.url === previous.url
              ? "specification-correction-proposal"
              : "specification-conflict-proposal",
          );
        if (changed(row, previous, ["url", "yearUrl", "priceUrl"]).length)
          type.push("source-change");
      }
      return [
        {
          identity,
          type: type.length ? type : ["unchanged"],
          missing,
          candidate: row,
          document: original,
        },
      ];
    }),
  );
  if (process.argv.includes("--emit-sql")) {
    const selected = proposals.filter(
      (proposal) =>
        proposal.type[0] !== "unchanged" && approved.has(proposal.identity),
    );
    if (!selected.length || selected.length !== approved.size)
      throw new Error(
        "Select every intended catalog change by exact --approve=identity",
      );
    if (selected.some((proposal) => proposal.missing.length))
      throw new Error(
        "Partial intake requires reconciliation before applying. Previously verified values were preserved.",
      );
    const payload = selected.map(({ candidate, document }) => {
      const record = normalizeReviewRow(candidate);
      return {
        record,
        diagram: diagramFor(record),
        original: {
          length: document.facts.length,
          beam: document.facts.beam,
          dryWeight: document.facts.weight,
          fuelCapacity: document.facts.fuel,
          storageCapacity: document.facts.storage,
        },
      };
    });
    console.log(
      `begin; select marine.import_catalog(convert_from(decode('${Buffer.from(JSON.stringify(payload)).toString("hex")}','hex'),'UTF8')::jsonb); commit;`,
    );
  } else
    console.log(
      JSON.stringify(
        {
          proposals,
          requests: 0,
          elapsedMs: Math.round(performance.now() - started),
        },
        null,
        2,
      ),
    );
} else
  throw new Error(
    "Use discover, stale, document <file> <profile.json>, or compare <editorial-batch.json>",
  );
