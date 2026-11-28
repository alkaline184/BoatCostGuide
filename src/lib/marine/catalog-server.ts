import { isLocalCatalogReview } from "./local-review";
import { manufacturerReview } from "./manufacturer-review-server";
import approved from "../../../catalog/approved.json";
import {
  isPublishable,
  normalizeReviewRow,
  validateCatalog,
  type ShoppingRecord,
} from "./shopping";

export function publicationDate() {
  return new Date().toISOString().slice(0, 10);
}

async function publishedRecords(): Promise<ShoppingRecord[]> {
  const endpoint = process.env.BOATCOSTGUIDE_SUPABASE_URL;
  const key = process.env.BOATCOSTGUIDE_SUPABASE_PUBLISHABLE_KEY;
  if (!endpoint && !key) return approved as unknown as ShoppingRecord[];
  if (!endpoint || !key) return [];
  const url = new URL("/rest/v1/marine_published_catalog", endpoint);
  if (
    url.protocol !== "https:" &&
    !["127.0.0.1", "localhost"].includes(url.hostname)
  )
    return [];
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const records: ShoppingRecord[] = [];
  url.searchParams.set("select", "record_data");
  url.searchParams.set("order", "variant_id");
  url.searchParams.set("limit", "100");
  for (let offset = 0; offset < 10000; offset += 100) {
    url.searchParams.set("offset", String(offset));
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const page = (await response.json()) as { record_data: ShoppingRecord }[];
    if (!Array.isArray(page)) return [];
    records.push(...page.map(({ record_data }) => record_data));
    if (page.length < 100) return records;
  }
  return records;
}

export async function publicCatalog(): Promise<ShoppingRecord[]> {
  const date = publicationDate();
  try {
    const records = await publishedRecords();
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
  const published = await publicCatalog();
  if (!(await isLocalCatalogReview()))
    return { records: published, reviewing: false };
  try {
    const review = await manufacturerReview(publicationDate());
    const records = [...review.baseline, ...review.rows].map(
      normalizeReviewRow,
    );
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
