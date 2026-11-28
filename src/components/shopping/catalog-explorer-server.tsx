import { catalogFacets, paginateCatalog } from "@/lib/marine/catalog-search";
import type { ShoppingRecord } from "@/lib/marine/shopping";
import { Explorer } from "./explorer";

export function CatalogExplorer({
  records,
  asOf,
  query,
  category,
  openBudget,
  manufacturerScope,
  typeScope,
}: {
  records: ShoppingRecord[];
  asOf: string;
  query?: string;
  category?: string;
  openBudget?: boolean;
  manufacturerScope?: string;
  typeScope?: string;
}) {
  return (
    <Explorer
      initial={paginateCatalog(records, asOf, { query, category }, 1)}
      facets={catalogFacets(records)}
      asOf={asOf}
      query={query}
      category={category}
      openBudget={openBudget}
      manufacturerScope={manufacturerScope}
      typeScope={typeScope}
    />
  );
}
