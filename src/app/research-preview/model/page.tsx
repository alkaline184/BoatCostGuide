import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BoatImage,
  ManufacturerCard,
  ModelCard,
  SpecificationSummary,
  priceSummary,
} from "@/components/research/boat-record";
import { FavoriteButton } from "@/components/research/comparison";
import { ScenarioFields } from "@/components/research/scenario-fields";

export default async function ModelPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { fixtures } = await import("@/components/research/catalog-fixtures");
  const [record, ...similar] = fixtures;
  return (
    <>
      <p className="research-notice">
        Development preview. Boat names and specifications are fictional.
        Financial results use your inputs.
      </p>
      <div className="research-model-hero">
        <div>
          <p className="editorial-kicker">
            {record.modelYear.year} · {record.variant.name}
          </p>
          <h1>{record.model.name}</h1>
          <ManufacturerCard record={record} />
          <p>{priceSummary(record)}</p>
          <div className="discovery-actions">
            <FavoriteButton label={record.model.name} />
            <Link className="button" href="/research-preview/compare">
              Compare demo boats
            </Link>
          </div>
        </div>
        <BoatImage
          record={record}
          sizes="(max-width: 650px) 90vw, 52vw"
          eager
        />
      </div>
      <div className="research-model-body">
        <section>
          <h2>Technical specifications</h2>
          <SpecificationSummary record={record} />
        </section>
        <section>
          <h2>Financing and five-year ownership</h2>
          <ScenarioFields title="Your ownership assumptions" />
        </section>
      </div>
      <section className="research-block">
        <h2>Safety and sources</h2>
        {record.variant.recalls.length ? (
          <ul>
            {record.variant.recalls.map(
              ({ value, source }) =>
                value && (
                  <li key={value.campaignId}>
                    <a href={source.url}>{value.campaignId}</a> ·{" "}
                    {value.applicability} · {value.summary}
                  </li>
                ),
            )}
          </ul>
        ) : (
          <p>
            Official recall applicability has not been checked for this record.
          </p>
        )}
        <p>
          Specifications source: {record.variant.source.provider} ·{" "}
          {record.variant.source.verification}
        </p>
      </section>
      <section className="research-block">
        <h2>Similar boats</h2>
        <div className="research-model-body">
          {similar.map((boat) => (
            <ModelCard key={boat.variant.id} record={boat} />
          ))}
        </div>
      </section>
    </>
  );
}
