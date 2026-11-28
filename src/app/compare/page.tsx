import { notFound } from "next/navigation";
import {
  CatalogUnavailableNotice,
  ShoppingPage,
} from "@/components/shopping/page-shell";
import { CompareBoats } from "@/components/shopping/scenario";
import {
  catalogForRequest,
  publicationDate,
  searchCatalog,
} from "@/lib/marine/catalog-server";
import { validateComparison } from "@/lib/marine/shopping";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/compare", {
  title: "Compare Boats & Ownership Costs",
  description:
    "Compare model specifications and estimate five-year ownership costs.",
  noindex: true,
});
export default async function Compare({
  searchParams,
}: {
  searchParams: Promise<{ models?: string | string[] }>;
}) {
  const { models } = await searchParams;
  const requested =
    typeof models === "string" ? models.slice(0, 400).split(",") : [];
  const selected = await catalogForRequest({ ids: requested, limit: 3 });
  const shortlist = await searchCatalog({}, 1, {}).catch(() => null);
  if (!shortlist || selected.unavailable) return <CatalogUnavailableNotice />;
  const reviewing = shortlist.reviewing;
  const options = [
    ...new Map(
      [...selected.records, ...shortlist.page.rows].map((item) => [
        item.variant.id,
        item,
      ]),
    ).values(),
  ];
  const records = [
    ...new Map(
      selected.records.map((record) => [record.variant.id, record]),
    ).values(),
  ];
  if (shortlist.page.count < 2) notFound();
  const initial = validateComparison(
    typeof models === "string" ? models.slice(0, 320).split(",") : [],
    records,
  );
  const choices =
    records.length <= 60
      ? records
      : records.filter(
          (record, index) => index < 57 || initial.includes(record.variant.id),
        );
  return (
    <ShoppingPage
      title="Compare boats"
      intro="Compare up to three US models. Keep published specifications separate from your ownership assumptions."
      crumbs={[
        ["Boat Explorer", "/boats"],
        ["Compare boats", "/compare"],
      ]}
      reviewing={reviewing}
    >
      <CompareBoats
        key={reviewing ? "review" : initial.join(",")}
        records={choices}
        options={reviewing ? undefined : options}
        initial={initial}
        asOf={publicationDate()}
      />
    </ShoppingPage>
  );
}
