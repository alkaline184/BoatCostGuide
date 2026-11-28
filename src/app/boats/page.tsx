import { CatalogExplorer } from "@/components/shopping/catalog-explorer-server";
import {
  CatalogCoverage,
  ShoppingPage,
} from "@/components/shopping/page-shell";
import { searchCatalog, publicationDate } from "@/lib/marine/catalog-server";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  return pageMetadata("/boats", {
    title: "Boat Explorer & US Buying Resources",
    description:
      "Explore US recreational boat types, manufacturer lineups, and boat ownership planning tools.",
    noindex:
      process.env.NODE_ENV === "development" ||
      Boolean(Object.keys(query).length) ||
      !(await searchCatalog({}, 1, {}).catch(() => null))?.page.count,
  });
}
export default async function Boats({ searchParams }: Props) {
  const params = await searchParams;
  const string = (name: string) =>
    typeof params[name] === "string" ? params[name].slice(0, 100) : "";
  const result = await searchCatalog(
    { query: string("q"), category: string("type") },
    1,
    {},
  ).catch(() => null);
  const available = result && result.facets.brands.length > 0;
  return (
    <ShoppingPage
      title="Boat Explorer"
      intro={
        available
          ? "Browse a curated US catalog and compare model years, specifications and ownership assumptions."
          : "Compare boat types, find official manufacturer lineups, and plan your purchase budget."
      }
      crumbs={[["Boat Explorer", "/boats"]]}
      reviewing={result?.reviewing ?? false}
    >
      {available ? (
        <CatalogExplorer
          result={result}
          asOf={publicationDate()}
          query={string("q")}
          category={string("type")}
          openBudget={string("budget") === "1"}
        />
      ) : (
        <p className="catalog-empty">
          {result
            ? "The model catalog is awaiting publication review. Explore official lineups and budget tools below."
            : "The boat catalog is temporarily unavailable. Buying guides and calculators are still available."}
        </p>
      )}
      <CatalogCoverage />
    </ShoppingPage>
  );
}
