import {
  mkdir,
  open,
  readFile,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import { loadEnvFile } from "node:process";
import {
  BoatDbError,
  createBoatDbClient,
  list,
  object,
  num,
  str,
} from "../../src/lib/marine/providers/theboatdb/client.ts";
import {
  createBoatDbRepository,
  mapBoat,
  readPage,
  type ProviderBoat,
} from "../../src/lib/marine/providers/theboatdb/repository.ts";
import { otherMakers, targets } from "./benchmark-targets.ts";
import { readExpandedFields } from "../../src/lib/marine/evaluation/provider-fields.ts";

const dir = ".marine-evaluation";
await mkdir(dir, { mode: 0o700, recursive: true });
async function run() {
  const cachedReport = await readFile(dir + "/audit.json", "utf8").catch(
    (error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    },
  );
  if (cachedReport && object(JSON.parse(cachedReport)).complete === true) {
    console.log(
      "Completed private audit already exists. Open the dashboard or run the photography audit.",
    );
    return;
  }
  loadEnvFile(".env.local");
  const ledger = dir + "/request-ledger";
  const consumed = Number(
    await readFile(ledger, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "0";
      throw error;
    }),
  );
  const available =
    Math.min(150, Number(process.env.THEBOATDB_EVALUATION_LIMIT ?? 150)) -
    consumed;
  if (!Number.isSafeInteger(available) || available <= 0)
    throw new Error("Completion request budget unavailable");
  const client = createBoatDbClient({
    key: process.env.THEBOATDB_API_KEY ?? "",
    ceiling: available,
    fetcher: async (input, init) => {
      await writeFile(ledger, String(consumed + client.stats.attempts), {
        mode: 0o600,
      });
      return fetch(input, init);
    },
  });
  const repo = createBoatDbRepository(client);
  let skippedRows = 0;
  async function search(query: Record<string, string | number>) {
    const body = await client.get("/boats", query);
    const page = readPage(body, (value) => {
      try {
        return mapBoat(value);
      } catch {
        skippedRows++;
        return null;
      }
    });
    return { ...page, data: page.data.filter((row) => row !== null) };
  }
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const audit: {
    date: string;
    usage: Record<string, unknown>;
    totals: Record<string, number>;
    years: Record<string, number>;
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
    sample: Record<string, number>;
    benchmark: Array<Record<string, unknown>>;
    anomalies: Array<Record<string, unknown>>;
    photos: Array<Record<string, unknown>>;
    complete: boolean;
    error?: string;
  } = {
    date: new Date().toISOString(),
    usage: {},
    totals: {},
    years: {},
    makers: [],
    cohorts: {},
    sample: {},
    benchmark: [],
    anomalies: [],
    photos: [],
    complete: false,
  };
  async function publish() {
    audit.usage = {
      ...client.stats,
      priorCompletionRequests: consumed,
      completionRequests: consumed + client.stats.attempts,
      skippedRows,
    };
    await writeFile(dir + "/audit.tmp", JSON.stringify(audit, null, 2), {
      mode: 0o600,
    });
    await rename(dir + "/audit.tmp", dir + "/audit.json");
  }
  const categoryQueries = [
    ["catalog", {}],
    ["power", { type: "power" }],
    ["sail", { type: "sail" }],
    ["pwcActivity", { activity: "pwc" }],
    ["pontoonCategory", { category: "pontoon-boats" }],
    ["waterjetCategory", { category: "waterjet-boats" }],
    ["recentOverlap", { yearFrom: 2020, yearTo: 2027 }],
  ] as Array<[string, Record<string, string | number>]>;
  const makers = [
    ...new Map<string, { query: string; category: string }>(
      [
        ...targets.map(
          (group) =>
            [
              group.maker,
              { query: group.search, category: group.category },
            ] as const,
        ),
        ...otherMakers.map(
          ([name, query]) =>
            [name, { query, category: "Other recreational" }] as const,
        ),
        ...[
          "Cobalt Boats",
          "Nautique",
          "Robalo Boats",
          "Lowe Boats",
          "Ranger Boats",
          "Grady-White",
        ].map(
          (name) =>
            [
              name,
              { query: name.split(" ")[0], category: "Other recreational" },
            ] as const,
        ),
      ].reverse(),
    ).entries(),
  ].reverse();
  const makerSearch = new Map<
    string,
    Awaited<ReturnType<typeof repo.makers>>
  >();
  const makerBoats = new Map<string, ProviderBoat[]>();
  const sampled = new Map<string, ProviderBoat>();
  const details = new Map<string, Awaited<ReturnType<typeof detailed>>>();
  const lookup = async (name: string, query: string) => {
    if (!makerSearch.has(query))
      makerSearch.set(query, await repo.makers(query));
    const options = makerSearch.get(query)!.data;
    return (
      options.find((row) => norm(row.name) === norm(name)) ??
      options.find((row) => norm(row.name) === norm(name).replace(/boats$/, ""))
    );
  };
  async function detailed(id: string) {
    const payload = object((await client.get("/boats/" + id)).data);
    const boat = mapBoat(payload);
    const dimension = object(payload.dimensions);
    const fuel = object(payload.tanks).fuel;
    const price = object(payload.referencePrice);
    const engines = list(payload.engines).map(object);
    return {
      boat,
      facts: {
        length: num(payload.lengthOverall),
        metricLength: num(payload.lengthOverallMetres),
        beam: num(dimension.beamOverall),
        dryWeight: num(dimension.dryWeight ?? payload.dryWeight),
        displacement: num(dimension.displacement),
        passenger: num(
          payload.passengerCapacity ?? object(payload.accommodation).passengers,
        ),
        ...readExpandedFields(payload),
        engineCount: engines.length || null,
        engineModels: engines.flatMap((row) => str(row.model) ?? []),
        fuelShape: Array.isArray(fuel)
          ? "array"
          : fuel === null
            ? "null"
            : typeof fuel,
        unit: str(payload.unit),
        date: str(price.date ?? price.observedAt),
        basis: str(price.basis ?? price.type),
      },
      media: {
        primary: !!str(object(payload.image).url),
        gallery: list(payload.gallery).length,
        width: num(object(payload.image).width),
        height: num(object(payload.image).height),
        alt: !!str(object(payload.image).alt),
        credit: !!str(
          object(payload.image).credit ?? object(payload.image).attribution,
        ),
      },
    };
  }
  function compareCandidates(
    rows: ProviderBoat[],
    model: string,
    year: number,
  ) {
    const key = norm(model);
    const nameMatches = rows.filter((row) =>
      [norm(row.model), norm(row.model + (row.version ?? ""))].includes(key),
    );
    const overlap = nameMatches.filter(
      (row) =>
        row.firstYear !== null &&
        row.firstYear <= year &&
        (row.lastYear === null || row.lastYear >= year),
    );
    return { nameMatches, overlap };
  }
  function mediaRow(
    result: Awaited<ReturnType<typeof detailed>>,
    expected: string,
    category: string,
  ) {
    const { boat, media } = result;
    return {
      id: boat.id,
      label: [boat.maker, boat.model, boat.version].filter(Boolean).join(" "),
      expected,
      category,
      url: boat.photos[0]?.url ?? null,
      ...media,
    };
  }

  try {
    const first = await search({ limit: 1 });
    audit.totals.catalog = first.total;
    await publish();
    audit.totals.manufacturers = (await repo.makers()).total;
    for (const [name, query] of categoryQueries.slice(1)) {
      const page = await search({
        ...query,
        limit: 30,
        sort: "model",
        order: "asc",
      });
      audit.totals[name] = page.total;
      let rows = page.data;
      if (page.total > page.limit && name !== "recentOverlap") {
        const spread = await search({
          ...query,
          limit: 30,
          offset: Math.max(0, Math.floor(page.total / 2) - 15),
          sort: "model",
          order: "asc",
        });
        rows = [
          ...new Map(
            [...rows, ...spread.data].map((row) => [row.id, row]),
          ).values(),
        ];
      }
      for (const row of rows) sampled.set(row.id, row);
      audit.cohorts[name] = {
        size: rows.length,
        makers: new Set(rows.flatMap((row) => row.makerId ?? [])).size,
        primary: rows.filter((row) => row.photos.length).length,
        priced: rows.filter((row) => row.reference).length,
        usd: rows.filter((row) => row.reference?.currency === "USD").length,
        newestStart:
          Math.max(0, ...rows.flatMap((row) => row.firstYear ?? [])) || null,
      };
    }
    for (let year = 2020; year <= 2027; year++) {
      audit.years[year] = (
        await search({ yearFrom: year, yearTo: year, limit: 1 })
      ).total;
    }
    for (const offset of [0, 1594, 3218, 4842, 6446]) {
      const page = await search({
        limit: 30,
        offset,
        sort: "manufacturer",
        order: "asc",
      });
      for (const row of page.data) sampled.set(row.id, row);
    }
    const sample = [...sampled.values()];
    audit.sample = {
      size: sample.length,
      primary: sample.filter((row) => row.photos.length).length,
      priced: sample.filter((row) => row.reference).length,
      usd: sample.filter((row) => row.reference?.currency === "USD").length,
      eur: sample.filter((row) => row.reference?.currency === "EUR").length,
      otherCurrency: sample.filter(
        (row) =>
          row.reference && !["USD", "EUR"].includes(row.reference.currency),
      ).length,
      newestStart: Math.max(0, ...sample.flatMap((row) => row.firstYear ?? [])),
    };
    await publish();
    // Read priority makers first so optional additional taxonomy cannot block the benchmark.
    for (const [name, { query, category }] of makers) {
      const maker = await lookup(name, query);
      if (!maker) continue;
      const priority = targets.some((group) => group.maker === name);
      const page = await search({
        manufacturer: maker.slug,
        limit: priority ? 100 : 1,
      });
      if (priority) makerBoats.set(name, page.data);
      const recent = await search({
        manufacturer: maker.slug,
        yearFrom: 2020,
        yearTo: 2027,
        limit: 1,
      });
      audit.makers.push({
        name,
        all: page.total,
        recent: recent.total,
        cohort: category,
      });
      await publish();
      if (!priority) continue;
      for (const group of targets.filter(
        (group) => group.maker === name && group.year !== null,
      )) {
        for (const model of group.models) {
          const { nameMatches, overlap } = compareCandidates(
            page.data,
            model,
            group.year!,
          );
          const candidates = overlap.length ? overlap : nameMatches;
          const status =
            candidates.length > 1
              ? "ambiguous"
              : candidates.length === 1
                ? "approximate"
                : "missing";
          for (const row of candidates.slice(0, 3)) {
            if (!details.has(row.id))
              details.set(row.id, await detailed(row.id));
          }
          const matches = candidates.map((row) => {
            const exactDetail = details.get(row.id);
            return {
              id: row.id,
              first: row.firstYear,
              last: row.lastYear,
              reference: row.reference,
              facts: exactDetail?.facts ?? null,
              media: exactDetail?.media ?? null,
            };
          });
          audit.benchmark.push({
            maker: name,
            model,
            targetYear: group.year,
            category: group.category,
            classification: status,
            confidence: overlap.length
              ? "Production window overlaps target. Exact US model year unverified."
              : nameMatches.length
                ? "Name matches outside or without known production window."
                : "No candidate in provider maker results.",
            photoCorrectness: "Unverified",
            source: group.source,
            matches,
          });
          if (candidates[0]) {
            const result = details.get(candidates[0].id);
            if (
              result &&
              !audit.photos.some((row) => row.id === result.boat.id)
            )
              audit.photos.push(mediaRow(result, model, group.category));
          }
          await publish();
        }
      }
    }
    const sea = makerBoats.get("Sea Doo") ?? [];
    const anomaly = sea.filter(
      (row) =>
        /gtx/i.test(row.model) &&
        /170/.test(row.model + (row.version ?? "")) &&
        row.firstYear === 2025,
    );
    for (const row of anomaly) {
      if (!details.has(row.id)) details.set(row.id, await detailed(row.id));
      const result = details.get(row.id)!;
      audit.anomalies.push({
        id: row.id,
        model: row.model,
        version: row.version,
        lengthSummaryMetres: row.lengthMetres,
        facts: result.facts,
      });
    }
    if (audit.benchmark.length !== 50)
      throw new BoatDbError("BENCHMARK_INCOMPLETE");
    audit.complete = true;
  } catch (error) {
    audit.error = error instanceof BoatDbError ? error.code : "AUDIT_FAILED";
    process.exitCode = 1;
  } finally {
    await publish();
    console.log(
      JSON.stringify({
        usage: audit.usage,
        totals: audit.totals,
        years: audit.years,
        makers: audit.makers.length,
        targets: audit.benchmark.length,
        photos: audit.photos.length,
        complete: audit.complete,
        error: audit.error,
      }),
    );
  }
}

const lockPath = dir + "/run.lock";
const lock = await open(lockPath, "wx", 0o600);
try {
  await run();
} finally {
  await lock.close();
  await unlink(lockPath);
}
