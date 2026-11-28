import { notFound } from "next/navigation";
import { CatalogExplorer } from "@/components/shopping/catalog-explorer-server";
import {
  CatalogUnavailableNotice,
  ShoppingPage,
} from "@/components/shopping/page-shell";
import {
  catalogForRequest,
  publicationDate,
  searchCatalog,
} from "@/lib/marine/catalog-server";
import { pageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ manufacturer: string }> };
export async function generateMetadata({ params }: Props) {
  const { manufacturer } = await params;
  const { records, reviewing } = await catalogForRequest({
    manufacturer,
    limit: 24,
  });
  const brand = records.find(
    (record) => record.manufacturer.id === manufacturer,
  )?.manufacturer;
  if (!brand) return {};
  return pageMetadata(`/boats/${manufacturer}`, {
    title: `${brand.name} Models & Ownership Costs`,
    description: `Research verified ${brand.name} US model-year specifications and estimate the costs of buying and owning a boat.`,
    noindex: reviewing,
  });
}
export default async function Manufacturer({ params }: Props) {
  const { manufacturer } = await params;
  const { records, reviewing, unavailable } = await catalogForRequest({
    manufacturer,
    limit: 24,
  });
  if (unavailable) return <CatalogUnavailableNotice />;
  const matching = records.filter(
    (record) => record.manufacturer.id === manufacturer,
  );
  if (new Set(matching.map(({ model }) => model.id)).size < 2) notFound();
  const brand = matching[0].manufacturer;
  return (
    <ShoppingPage
      title={brand.name}
      intro="Browse verified US model-year variants and check what is included in the manufacturer’s starting price."
      crumbs={[
        ["Boat Explorer", "/boats"],
        [brand.name, `/boats/${manufacturer}`],
      ]}
      reviewing={reviewing}
    >
      <p className="catalog-note">
        Compare the exact trim and engine with the dealer’s quote. For older
        models, confirm that the year on the quote matches the hull
        identification and paperwork.
      </p>
      {brand.website && (
        <p>
          <a className="catalog-link" href={brand.website}>
            Visit the official {brand.name} website
          </a>
        </p>
      )}
      <CatalogExplorer
        result={await searchCatalog({}, 1, { manufacturer }).catch(
          () => undefined,
        )}
        manufacturerScope={manufacturer}
        records={matching}
        asOf={publicationDate()}
      />
    </ShoppingPage>
  );
}
