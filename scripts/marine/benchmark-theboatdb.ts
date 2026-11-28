import { lookup } from "node:dns/promises";
import { loadEnvFile } from "node:process";
import {
  BoatDbError,
  boatDbKeyKind,
  createBoatDbClient,
  object,
  str,
} from "../../src/lib/marine/providers/theboatdb/client.ts";
import {
  createBoatDbRepository,
  type ProviderBoat,
} from "../../src/lib/marine/providers/theboatdb/repository.ts";
import { otherMakers, targets } from "./benchmark-targets.ts";

try {
  loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT")
    throw new Error("Local environment could not be read");
}
const key = process.env.THEBOATDB_API_KEY ?? "";
const kind = boatDbKeyKind(key);
if (kind !== "live") {
  console.error(
    key
      ? "The configured key is not recognized as live. No authenticated request was sent."
      : "THEBOATDB_API_KEY is unavailable.",
  );
  process.exit(2);
}
const client = createBoatDbClient({
  key,
  ceiling: Number(process.env.THEBOATDB_EVALUATION_LIMIT ?? 250),
});
const repo = createBoatDbRepository(client);
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const totals: Record<string, number> = {};
const makers: Record<
  string,
  { matches: number; records?: number; sampled?: number }
> = {};
const benchmarks: Array<Record<string, number | string>> = [];
const sample = new Map<string, ProviderBoat>();
const detail = new Map<string, ProviderBoat>();
let version: string | null = null;
const connectivity: Record<string, number | string | null> = {};
function add(rows: ProviderBoat[]) {
  for (const row of rows) sample.set(row.id, row);
}
try {
  await lookup("api.theboatdb.com");
  connectivity.dns = "ok";
  const response = await fetch("https://api.theboatdb.com/v1", {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  connectivity.versionStatus = response.status;
  const apiVersion = str(object(await response.json()).apiVersion);
  if (apiVersion && /^v?\d+(\.\d+){0,2}$/.test(apiVersion))
    version = apiVersion;
  const first = await repo.search({ limit: 2 });
  totals.catalog = first.total;
  connectivity.authStatus = client.stats.lastStatus;
  connectivity.authDurationMs = client.stats.lastDurationMs;
  connectivity.authContentType = client.stats.lastContentType;
  connectivity.limit = first.limit;
  connectivity.offset = first.offset;
  add(first.data);
  if (!process.argv.includes("--connectivity")) {
    totals.manufacturers = (await repo.makers()).total;
    for (const type of ["power", "sail"]) {
      const page = await repo.search({
        type,
        limit: 1,
        sort: "year",
        order: "desc",
      });
      totals[type] = page.total;
      const year = page.data[0]?.firstYear;
      if (year) totals[type + "NewestStart"] = year;
      add(page.data);
    }
    const filters: Array<{ key: string; query: Record<string, string> }> = [
      { key: "pwcActivity", query: { activity: "pwc" } },
      { key: "pontoonsCategory", query: { category: "pontoon-boats" } },
      { key: "waterjetCategory", query: { category: "waterjet-boats" } },
    ];
    for (const filter of filters) {
      const page = await repo.search({ ...filter.query, limit: 1 });
      totals[filter.key] = page.total;
    }
    const selectedMakers = process.argv
      .find((argument) => argument.startsWith("--makers="))
      ?.slice(9)
      .split(",");
    const makerSearch = new Map<
      string,
      Awaited<ReturnType<typeof repo.makers>>
    >();
    for (const [maker, query] of [
      ...targets.map(({ maker, search }) => [maker, search] as const),
      ...otherMakers,
    ]) {
      if (makers[maker] || (selectedMakers && !selectedMakers.includes(maker)))
        continue;
      const options = makerSearch.get(query) ?? (await repo.makers(query));
      makerSearch.set(query, options);
      const exact = options.data.filter(
        ({ name }) =>
          norm(name) === norm(maker) ||
          (maker === "Regal Boats" && norm(name) === "regal"),
      );
      makers[maker] = { matches: exact.length };
      if (exact.length !== 1) continue;
      const manufacturer = exact[0].slug;
      const priority = targets.some((target) => target.maker === maker);
      const page = await repo.search({
        manufacturer,
        limit: priority ? 100 : 1,
        sort: "year",
        order: "desc",
      });
      makers[maker].records = page.total;
      makers[maker].sampled = page.data.length;
      add(page.data);
      for (const group of targets.filter((target) => target.maker === maker)) {
        const comparisons = group.models.map((model) => {
          const canonical = norm(model);
          const matches = page.data.filter((row) =>
            [norm(row.model), norm(row.model + (row.version ?? ""))].includes(
              canonical,
            ),
          );
          const overlap = matches.filter(
            (row) =>
              group.year !== null &&
              row.firstYear !== null &&
              row.firstYear <= group.year &&
              (row.lastYear === null || row.lastYear >= group.year),
          );
          return { matches, overlap };
        });
        benchmarks.push({
          brand: maker,
          category: group.category,
          targets: comparisons.length,
          candidateIdentity: comparisons.filter((row) => row.matches.length)
            .length,
          candidateWindow:
            group.year === null
              ? "unverified US model year"
              : comparisons.filter((row) => row.overlap.length).length,
          ambiguousWindow: comparisons.filter((row) => row.overlap.length > 1)
            .length,
          exactMarketYearConfirmed: 0,
        });
        for (const result of comparisons) {
          if (detail.size >= 15) break;
          const candidate =
            result.overlap.length === 1
              ? result.overlap[0]
              : group.year === null && result.matches.length === 1
                ? result.matches[0]
                : undefined;
          if (candidate && !detail.has(candidate.id))
            detail.set(candidate.id, await repo.detail(candidate.id));
        }
      }
    }
  }
} catch (error) {
  console.error(
    error instanceof BoatDbError
      ? { code: error.code, status: error.status }
      : { code: "CONNECTIVITY_FAILED" },
  );
  process.exitCode = 1;
}
const rows = [...sample.values()];
const details = [...detail.values()];
console.log(
  JSON.stringify(
    {
      credentialKind: kind,
      version,
      connectivity,
      requestStats: client.stats,
      totals,
      makers,
      benchmarks,
      sample: {
        unique: rows.length,
        photos: rows.filter((row) => row.photos.length).length,
        missingLength: rows.filter((row) => row.lengthMetres === null).length,
        missingProductionStart: rows.filter((row) => row.firstYear === null)
          .length,
        missingReferencePrice: rows.filter((row) => !row.reference).length,
        referenceCurrencies: [
          ...new Set(rows.flatMap((row) => row.reference?.currency ?? [])),
        ].sort(),
        detail: details.length,
        multiplePhotos: details.filter((row) => row.photos.length > 1).length,
        missingBeam: details.filter((row) => row.beam === null).length,
        missingDraft: details.filter((row) => row.draft === null).length,
        missingEnginePower: details.filter(
          (row) => !row.engines.some((engine) => engine.power !== null),
        ).length,
        newestObservedStart:
          Math.max(0, ...rows.flatMap((row) => row.firstYear ?? [])) || null,
        categories: Object.entries(
          details
            .flatMap((row) => row.categories)
            .reduce<Record<string, number>>((counts, name) => {
              counts[name] = (counts[name] ?? 0) + 1;
              return counts;
            }, {}),
        ),
      },
    },
    null,
    2,
  ),
);
