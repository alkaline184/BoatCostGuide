import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import {
  BoatDbError,
  createBoatDbClient,
  object,
} from "../../src/lib/marine/providers/theboatdb/client.ts";
import type {
  Candidate,
  ProviderAudit,
} from "../../src/lib/marine/evaluation/metrics.ts";
import { readExpandedFields } from "../../src/lib/marine/evaluation/provider-fields.ts";

const dir = ".marine-evaluation/";
const lockPath = dir + "run.lock";
const lock = await open(lockPath, "wx", 0o600);
try {
  const audit = JSON.parse(
    await readFile(dir + "audit.json", "utf8"),
  ) as ProviderAudit;
  if (!audit.complete) throw new Error("Complete the benchmark first");
  const consumed = Number(await readFile(dir + "request-ledger", "utf8"));
  loadEnvFile(".env.local");
  const budget =
    Math.min(150, Number(process.env.THEBOATDB_EVALUATION_LIMIT ?? 150)) -
    consumed;
  if (!Number.isSafeInteger(budget) || budget <= 0)
    throw new Error("No remaining completion requests");
  const client = createBoatDbClient({
    key: process.env.THEBOATDB_API_KEY ?? "",
    ceiling: budget,
    fetcher: async (input, init) => {
      await writeFile(
        dir + "request-ledger",
        String(consumed + client.stats.attempts),
        { mode: 0o600 },
      );
      return fetch(input, init);
    },
  });

  const ordered = [...audit.benchmark].sort(
    (left, right) =>
      Number(left.classification === "ambiguous") -
      Number(right.classification === "ambiguous"),
  );
  const candidates = new Map<string, Candidate[]>();
  for (const row of ordered)
    for (const candidate of row.matches) {
      if (!candidates.has(candidate.id)) candidates.set(candidate.id, []);
      candidates.get(candidate.id)!.push(candidate);
    }

  const successes = audit.usage.successful;
  const failures = audit.usage.failed;
  async function publish() {
    audit.usage.completionRequests = consumed + client.stats.attempts;
    audit.usage.successful = successes + client.stats.successful;
    audit.usage.failed = failures + client.stats.failed;
    audit.usage.remaining = client.stats.remaining ?? audit.usage.remaining;
    await writeFile(dir + "audit.tmp", JSON.stringify(audit, null, 2), {
      mode: 0o600,
    });
    await rename(dir + "audit.tmp", dir + "audit.json");
  }
  let checked = 0;
  try {
    for (const [id, rows] of candidates) {
      if (
        rows.every((row) => row.facts?.expandedFieldsChecked) ||
        client.stats.attempts >= budget
      )
        continue;
      const raw = object((await client.get("/boats/" + id)).data);
      const expanded = readExpandedFields(raw);
      for (const row of rows) if (row.facts) Object.assign(row.facts, expanded);
      checked++;
      await publish();
    }
  } catch (error) {
    console.error(
      error instanceof BoatDbError ? error.code : "FIELD_AUDIT_FAILED",
    );
    process.exitCode = 1;
  } finally {
    if (client.stats.attempts) await publish();
    console.log(
      JSON.stringify({
        checked,
        requests: client.stats.attempts,
        total: audit.usage.completionRequests,
        remaining: audit.usage.remaining,
      }),
    );
  }
} finally {
  await lock.close();
  await unlink(lockPath);
}
