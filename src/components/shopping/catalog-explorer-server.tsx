import { catalogFacets, paginateCatalog } from "@/lib/marine/catalog-search";
import type { ShoppingRecord } from "@/lib/marine/shopping";
import { Explorer } from "./explorer";

export function CatalogExplorer({
  records,
  result,
  asOf,
  query,
  category,
  openBudget,
  manufacturerScope,
  typeScope,
}: {
  records?: ShoppingRecord[];
  result?: {
    page: ReturnType<typeof paginateCatalog>;
    facets: ReturnType<typeof catalogFacets>;
  };
  asOf: string;
  query?: string;
  category?: string;
  openBudget?: boolean;
  manufacturerScope?: string;
  typeScope?: string;
}) {
  return (
    <Explorer
      initial={
        result?.page ??
        paginateCatalog(records ?? [], asOf, { query, category }, 1)
      }
      facets={result?.facets ?? catalogFacets(records ?? [])}
      asOf={asOf}
      query={query}
      category={category}
      openBudget={openBudget}
      manufacturerScope={manufacturerScope}
      typeScope={typeScope}
    />
  );
}
