import { notFound } from "next/navigation";
import { ShoppingPage } from "@/components/shopping/page-shell";
import { CompareBoats } from "@/components/shopping/scenario";
import {
  catalogForRequest,
  publicationDate,
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
  const { records, reviewing } = await catalogForRequest();
  if (records.length < 2) notFound();
  const { models } = await searchParams;
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
        records={choices}
        initial={initial}
        asOf={publicationDate()}
      />
    </ShoppingPage>
  );
}
