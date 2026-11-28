import { notFound } from "next/navigation";
import Image from "next/image";
import { Explorer } from "@/components/shopping/explorer";
import { ShoppingPage } from "@/components/shopping/page-shell";
import {
  catalogForRequest,
  publicationDate,
} from "@/lib/marine/catalog-server";
import { categoryMap, modelPath } from "@/lib/marine/shopping";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ type: string }> };
export async function generateMetadata({ params }: Props) {
  const { type } = await params;
  const info = Object.values(categoryMap).find((item) => item.slug === type);
  if (!info) return {};
  return pageMetadata(`/boat-types/${type}`, {
    title: `${info.label} Buyer’s Guide & Models`,
    description: info.guidance,
    noindex: process.env.NODE_ENV === "development",
  });
}
export default async function Category({ params }: Props) {
  const { type } = await params;
  const { records, reviewing } = await catalogForRequest();
  const matching = records.filter(
    (record) => categoryMap[record.model.category].slug === type,
  );
  if (new Set(matching.map(modelPath)).size < 2) notFound();
  const category = categoryMap[matching[0].model.category];
  return (
    <ShoppingPage
      title={category.label}
      intro={category.guidance}
      crumbs={[
        ["Boat Explorer", "/boats"],
        [category.label, `/boat-types/${type}`],
      ]}
      reviewing={reviewing}
    >
      <div className="catalog-category-art">
        <Image src={category.image} alt="" fill sizes="60vw" />
      </div>
      <Explorer records={matching} asOf={publicationDate()} />
    </ShoppingPage>
  );
}
