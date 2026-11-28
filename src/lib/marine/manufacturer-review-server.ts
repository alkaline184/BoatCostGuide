import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ReviewRow } from "./shopping";
import { adaptEditorialBatches } from "./manufacturer-ingestion";

export async function manufacturerReview(asOf: string) {
  const root = join(process.cwd(), "catalog");
  const baseline = JSON.parse(
    await readFile(join(root, "review.json"), "utf8"),
  ) as ReviewRow[];
  const directory = join(root, "manufacturers");
  const files = (await readdir(directory))
    .filter((file) => /^[a-z-]+\.json$/.test(file))
    .sort();
  const inputs = await Promise.all(
    files.map(
      async (file) =>
        JSON.parse(await readFile(join(directory, file), "utf8")) as unknown,
    ),
  );
  return { baseline, ...adaptEditorialBatches(inputs, asOf, baseline) };
}
