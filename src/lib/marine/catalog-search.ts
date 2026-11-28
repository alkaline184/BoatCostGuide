import {
  filterCatalog,
  sampleTerms,
  startingPrice,
  type Filters,
  type ShoppingRecord,
} from "./shopping";

export const catalogPageSize = 24;

export type CatalogPage = ReturnType<typeof paginateCatalog>;
export function paginateCatalog(
  records: ShoppingRecord[],
  asOf: string,
  filters: Filters,
  page: number,
  includePrices = false,
) {
  const rows = filterCatalog(records, filters, asOf, sampleTerms);
  const last = Math.max(1, Math.ceil(rows.length / catalogPageSize));
  const current = Math.min(Math.max(page, 1), last);
  return {
    rows: rows.slice(
      (current - 1) * catalogPageSize,
      current * catalogPageSize,
    ),
    count: rows.length,
    current,
    last,
    ...(includePrices
      ? {
          prices: rows.flatMap((record) => {
            const price = startingPrice(record, asOf);
            return price ? [price.amount] : [];
          }),
        }
      : {}),
  };
}

export function catalogFacets(records: ShoppingRecord[]) {
  return {
    brands: [
      ...new Map(
        records.map(({ manufacturer }) => [manufacturer.id, manufacturer.name]),
      ),
    ],
    years: [...new Set(records.map(({ modelYear }) => modelYear.year))].sort(
      (a, b) => b - a,
    ),
    propulsion: [
      ...new Set(
        records.flatMap(({ variant }) =>
          variant.specs.engine.value?.type
            ? [variant.specs.engine.value.type]
            : [],
        ),
      ),
    ],
  };
}
