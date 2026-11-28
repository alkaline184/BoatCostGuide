import { readFile } from "node:fs/promises";
import { join } from "node:path";
import approved from "../../../catalog/approved.json";
import {
  isPublishable,
  normalizeReviewRow,
  validateCatalog,
  type ReviewRow,
  type ShoppingRecord,
} from "./shopping";

export function publicationDate() {
  return new Date().toISOString().slice(0, 10);
}

export function publicCatalog(): ShoppingRecord[] {
  const records = approved as unknown as ShoppingRecord[];
  const date = publicationDate();
  try {
    if (
      !Array.isArray(records) ||
      validateCatalog(records, date, { allowStale: true }).length
    )
      return [];
    return records.filter((record) => isPublishable(record, date));
  } catch {
    return [];
  }
}

export async function catalogForRequest() {
  const published = publicCatalog();
  if (process.env.NODE_ENV !== "development")
    return { records: published, reviewing: false };
  try {
    const raw = await readFile(
      join(process.cwd(), "catalog", "review.json"),
      "utf8",
    );
    const records = (JSON.parse(raw) as ReviewRow[]).map(normalizeReviewRow);
    const issues = validateCatalog(records, publicationDate(), {
      allowStale: true,
    });
    if (issues.length) throw new Error(issues.join("\n"));
    const byId = new Map(records.map((record) => [record.variant.id, record]));
    for (const record of published) byId.set(record.variant.id, record);
    return { records: [...byId.values()], reviewing: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { records: published, reviewing: false };
    throw error;
  }
}
