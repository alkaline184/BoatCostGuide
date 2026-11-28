import { isLocalCatalogReview } from "./local-review";
import { manufacturerReview } from "./manufacturer-review-server";
import { CatalogUnavailable, catalogQuery } from "./catalog-data-api";
import {
  catalogFacets,
  paginateCatalog,
  type CatalogPage,
} from "./catalog-search";
import {
  isPublishable,
  normalizeReviewRow,
  validateCatalog,
  type ShoppingRecord,
  type Filters,
  categoryMap,
} from "./shopping";

export function publicationDate() {
  return new Date().toISOString().slice(0, 10);
}

type Scope = {
  manufacturer?: string;
  model?: string;
  category?: string;
  ids?: string[];
  limit?: number;
};
const slug = /^[a-z0-9][a-z0-9-]{0,119}$/;

export async function catalogForRequest(scope: Scope = {}) {
  if (await isLocalCatalogReview()) {
    const review = await manufacturerReview(publicationDate());
    const records = [...review.baseline, ...review.rows].map(
      normalizeReviewRow,
    );
    const issues = validateCatalog(records, publicationDate(), {
      allowStale: true,
    });
    if (issues.length) throw new Error(issues.join("\n"));
    return { records, reviewing: true, unavailable: false };
  }
  const conditions: Record<string, string> = {
    select: "record_data",
    order: "model_year.desc,variant_id",
    limit: String(scope.limit ?? 24),
  };
  for (const [key, value] of Object.entries({
    manufacturer_slug: scope.manufacturer,
    model_slug: scope.model,
    category_slug: scope.category,
  })) {
    if (value && !slug.test(value))
      return { records: [], reviewing: false, unavailable: false };
    if (value) conditions[key] = "eq." + value;
  }
  if (scope.ids) {
    const ids = scope.ids.filter((id) => slug.test(id)).slice(0, 3);
    if (!ids.length)
      return { records: [], reviewing: false, unavailable: false };
    conditions.variant_id = `in.(${ids.join(",")})`;
  }
  try {
    const rows = await catalogQuery<{ record_data: ShoppingRecord }[]>(
      "marine_catalog_read",
      conditions,
    );
    if (rows !== null && !Array.isArray(rows)) throw new CatalogUnavailable();
    const records = (rows ?? []).map((row) => row.record_data);
    if (records.some((record) => !isPublishable(record, publicationDate())))
      throw new CatalogUnavailable();
    return { records, reviewing: false, unavailable: false };
  } catch {
    return { records: [], reviewing: false, unavailable: true };
  }
}

export async function searchCatalog(
  filters: Filters,
  page: number,
  scope: Scope,
  prices = false,
  includeFacets = true,
) {
  if (await isLocalCatalogReview()) {
    const { records } = await catalogForRequest();
    const pool = records.filter(
      (r) =>
        (!scope.manufacturer || scope.manufacturer === r.manufacturer.id) &&
        (!scope.category || scope.category === r.model.category),
    );
    return {
      page: paginateCatalog(pool, publicationDate(), filters, page, prices),
      facets: catalogFacets(pool),
      reviewing: true,
    };
  }
  const result = await catalogQuery<CatalogPage>(
    "rpc/marine_search",
    {},
    {
      q: filters.query,
      brand: filters.brand,
      category: filters.category,
      scope_brand: scope.manufacturer,
      scope_category: scope.category,
      model_year_filter: filters.year,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      min_length: filters.minLength,
      min_hp: filters.minHp,
      min_passengers:
        filters.passengers == null ? undefined : Math.ceil(filters.passengers),
      propulsion_filter: filters.propulsion,
      sort_key: filters.sort,
      page_number: Math.min(page, 100000),
      include_prices: prices,
    },
  );
  if (
    result &&
    (!Array.isArray(result.rows) ||
      result.rows.length > 24 ||
      !Number.isInteger(result.count) ||
      result.rows.some(
        (row) =>
          !slug.test(row.variant?.id) ||
          !slug.test(row.manufacturer?.id) ||
          !slug.test(row.model?.id) ||
          !Object.hasOwn(categoryMap, row.model.category) ||
          !Array.isArray(row.variant.images) ||
          !Array.isArray(row.variant.prices) ||
          !row.variant.specs?.length,
      ))
  )
    throw new CatalogUnavailable();
  const facets =
    result && includeFacets
      ? await catalogQuery<ReturnType<typeof catalogFacets>>(
          "rpc/marine_catalog_facets",
          {},
          { scope_brand: scope.manufacturer, scope_category: scope.category },
        )
      : null;
  return {
    page:
      result ?? paginateCatalog([], publicationDate(), filters, page, prices),
    facets: facets ?? catalogFacets(result?.rows ?? []),
    reviewing: false,
  };
}

export async function catalogIdentities() {
  const identities: {
    manufacturer_slug: string;
    model_slug: string;
    category_slug: string;
  }[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const rows = await catalogQuery<typeof identities>("marine_catalog_read", {
      select: "manufacturer_slug,model_slug,category_slug",
      order: "variant_id",
      limit: "1000",
      offset: String(offset),
    });
    if (!Array.isArray(rows)) break;
    identities.push(
      ...rows.filter(
        (row) =>
          slug.test(row.manufacturer_slug) &&
          slug.test(row.model_slug) &&
          slug.test(row.category_slug),
      ),
    );
    if (rows.length < 1000) break;
  }
  return identities;
}
