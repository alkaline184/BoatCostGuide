import {
  filterCatalog,
  sampleTerms,
  startingPrice,
  type Filters,
  type ShoppingRecord,
} from "./shopping";

type Specs = ShoppingRecord["variant"]["specs"];
export type CatalogCardRecord = {
  manufacturer: Pick<ShoppingRecord["manufacturer"], "id" | "name">;
  model: Pick<ShoppingRecord["model"], "id" | "name" | "category">;
  modelYear: Pick<ShoppingRecord["modelYear"], "year">;
  variant: Pick<ShoppingRecord["variant"], "id" | "name" | "images"> & {
    prices: ReadonlyArray<
      Pick<ShoppingRecord["variant"]["prices"][number], "value">
    >;
    specs: {
      length: Pick<Specs["length"], "value">;
      beam: Pick<Specs["beam"], "value">;
      passengers: Pick<Specs["passengers"], "value">;
      widthBasis?: Pick<NonNullable<Specs["widthBasis"]>, "value">;
      engine: {
        value: Pick<NonNullable<Specs["engine"]["value"]>, "type"> | null;
      };
    };
  };
};
export type CatalogPage = {
  rows: CatalogCardRecord[];
  count: number;
  current: number;
  last: number;
  prices?: number[];
};
export const catalogPageSize = 24;

export function paginateCatalog(
  records: ShoppingRecord[],
  asOf: string,
  filters: Filters,
  page: number,
  includePrices = false,
): CatalogPage {
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

export function catalogFacets(records: CatalogCardRecord[]) {
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
