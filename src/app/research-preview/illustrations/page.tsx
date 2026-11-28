import { BoatFit } from "@/components/marine/boat-fit";
import { BoatScene, DiagramControls } from "@/components/marine/boat-diagrams";
import { CatalogCard } from "@/components/shopping/catalog-ui";
import {
  catalogForRequest,
  publicationDate,
} from "@/lib/marine/catalog-server";
import { requireLocalCatalogReview } from "@/lib/marine/local-review";
import { diagramFor, templates } from "@/lib/marine/illustrations";

export default async function IllustrationGallery() {
  await requireLocalCatalogReview();
  const { records } = await catalogForRequest();
  const samples = [
    ...new Map(
      records.map((record) => [record.model.category, record]),
    ).values(),
  ];
  const boats = samples.map(diagramFor);
  return (
    <>
      <h1>Marine illustration gallery</h1>
      <p>
        Catalog examples use checked specifications. The template grid uses
        synthetic geometry test cases.
      </p>
      {boats.length > 0 && (
        <>
          <DiagramControls boats={boats} />
          <BoatFit boat={boats[0]} />
          <h2>Catalog cards</h2>
          <div className="catalog-grid">
            {samples.map((record) => (
              <CatalogCard
                key={record.variant.id}
                record={record}
                asOf={publicationDate()}
              />
            ))}
          </div>
        </>
      )}
      <h2>Template library</h2>
      <div className="catalog-grid">
        {templates.map((template) => (
          <article key={template}>
            <h3>{template}</h3>
            <BoatScene
              boats={[
                {
                  template,
                  length: 160,
                  beam: 65,
                  label: "Synthetic geometry",
                },
              ]}
            />
            <BoatScene
              blueprint
              top
              boats={[
                {
                  template,
                  length: 160,
                  beam: 65,
                  label: "Synthetic geometry",
                },
              ]}
            />
          </article>
        ))}
      </div>
    </>
  );
}
