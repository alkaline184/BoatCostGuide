import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShoppingPage } from "@/components/shopping/page-shell";
import {
  gtx2025,
  gtx2025Sheet,
  loadOemFacts,
} from "@/lib/marine/evaluation/enrichment";
import {
  coreFields,
  evaluateBenchmark,
  type PhotoAudit,
  type PhotoNotes,
  type ProviderAudit,
} from "@/lib/marine/evaluation/metrics";
import { requireLocalBoatDbReview } from "@/lib/marine/providers/theboatdb/local";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private Marine Data Quality",
  robots: { index: false, follow: false, nocache: true },
};

async function readAudit<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(
      await readFile(join(process.cwd(), ".marine-evaluation", name), "utf8"),
    ) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
const percent = (n: number, d: number) =>
  d ? ((100 * n) / d).toFixed(1) + "%" : "Unavailable";
const ratio = (n: number, d: number) => `${n} / ${d} (${percent(n, d)})`;
const format = (n: number | null | undefined) =>
  n == null ? "Unavailable" : n.toLocaleString("en-US");
function providerLink(id: string) {
  return "/provider-review?" + new URLSearchParams({ model: id });
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="catalog-scenario">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Table({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div
      className="tool-table catalog-table"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((item, j) =>
                j === 0 ? (
                  <th scope="row" key={j}>
                    {item}
                  </th>
                ) : (
                  <td key={j}>{item}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const assetDisplay = (value: boolean | undefined) =>
  value === undefined ? "Unverified" : value ? "Yes" : "No";

export default async function QualityDashboard() {
  await requireLocalBoatDbReview();
  const [audit, photos, status, oem] = await Promise.all([
    readAudit<ProviderAudit>("audit.json"),
    readAudit<PhotoAudit[]>("photos.json"),
    readAudit<PhotoNotes>("photo-notes.json"),
    loadOemFacts(),
  ]);
  const report = audit ? evaluateBenchmark(audit, oem.verifiedOemFacts) : null;
  const photoById = new Map(photos?.map((photo) => [photo.id, photo]));
  const photoCounts = (predicate: (photo: PhotoAudit) => boolean) =>
    photos?.filter(predicate).length ?? 0;
  const authenticated = audit?.usage.completionRequests ?? 0;
  return (
    <ShoppingPage
      title="Marine data quality"
      intro="Private review of TheBoatDB coverage and accuracy."
      crumbs={[
        ["Private Boat Explorer", "/provider-review"],
        ["Data quality", "/provider-review/quality"],
      ]}
      reviewing={false}
    >
      <p className="research-notice">
        <a href="https://theboatdb.com/">Data by TheBoatDB</a>. Evaluation only.
        Production windows do not establish an exact US model year.
      </p>
      <p>
        <Link href="/provider-review" prefetch={false}>
          Open the private Boat Explorer
        </Link>
      </p>
      {!audit || !report ? (
        <p className="catalog-empty">
          No local audit report is available. Run{" "}
          <code>npm run catalog:theboatdb-complete</code>.
        </p>
      ) : (
        <>
          <Section title="Request usage">
            <p>
              {audit.complete
                ? "Audit complete."
                : "Audit in progress or incomplete."}{" "}
              {audit.error && "Last run ended with " + audit.error + "."}
            </p>
            <dl className="research-specs">
              <div>
                <dt>Completion requests used</dt>
                <dd>{authenticated} / 150 maximum</dd>
              </div>
              <div>
                <dt>Provider quota remaining</dt>
                <dd>
                  {format(audit.usage.remaining)} / {format(audit.usage.quota)}
                </dd>
              </div>
              <div>
                <dt>Recorded by the completed runs</dt>
                <dd>
                  {audit.usage.successful} successful, {audit.usage.failed}{" "}
                  failed
                </dd>
              </div>
              <div>
                <dt>Provider rate limit</dt>
                <dd>{format(audit.usage.rate)} per minute</dd>
              </div>
              <div>
                <dt>Malformed row observations</dt>
                <dd>{format(audit.usage.skippedRows)}</dd>
              </div>
            </dl>
          </Section>
          <Section title="Coverage and pricing">
            <Table
              caption="Provider catalog counts"
              headers={["Filter", "Records"]}
              rows={(
                [
                  ["Catalog", "catalog"],
                  ["Power type", "power"],
                  ["Sail type", "sail"],
                  ["PWC activity", "pwcActivity"],
                  ["Pontoon category", "pontoonCategory"],
                  ["Waterjet category", "waterjetCategory"],
                  ["Overlaps 2020–2027", "recentOverlap"],
                  ["Manufacturers", "manufacturers"],
                ] as const
              ).map(([name, key]) => [name, format(audit.totals[key])])}
            />
            <p>
              Type, activity and category boundaries differ. A record can match
              multiple production years.
            </p>
            <Table
              caption="Production windows by overlap"
              headers={["Year", "Records"]}
              rows={Object.entries(audit.years).map(([year, count]) => [
                year,
                format(count),
              ])}
            />
            <Table
              caption="Category samples"
              headers={[
                "Filter",
                "Unique sampled records",
                "Manufacturers observed",
                "Primary photos",
                "USD prices",
                "Newest start observed",
              ]}
              rows={Object.entries(audit.cohorts).map(([name, cohort]) => [
                name,
                cohort.size,
                cohort.makers,
                ratio(cohort.primary, cohort.size),
                ratio(cohort.usd, cohort.size),
                format(cohort.newestStart),
              ])}
            />
            <p>
              Mixed sample of {format(audit.sample.size)} unique records.
              Primary photo{" "}
              {ratio(audit.sample.primary ?? 0, audit.sample.size ?? 0)}. Any
              reference price{" "}
              {ratio(audit.sample.priced ?? 0, audit.sample.size ?? 0)}. USD{" "}
              {ratio(audit.sample.usd ?? 0, audit.sample.size ?? 0)}. EUR{" "}
              {ratio(audit.sample.eur ?? 0, audit.sample.size ?? 0)}. Other
              currencies{" "}
              {ratio(audit.sample.otherCurrency ?? 0, audit.sample.size ?? 0)}.
            </p>
            <Table
              caption="Candidate manufacturers by recent record count"
              headers={[
                "Manufacturer",
                "Evaluation cohort",
                "All records",
                "2020–2027 overlap",
              ]}
              rows={[...audit.makers]
                .sort((a, b) => (b.recent ?? 0) - (a.recent ?? 0))
                .map((maker) => [
                  maker.name,
                  maker.cohort,
                  maker.all,
                  format(maker.recent),
                ])}
            />
          </Section>
          <Section title="50-model benchmark">
            <dl className="research-specs">
              <div>
                <dt>Exact US model-year matches</dt>
                <dd>{ratio(report.exact, 50)}</dd>
              </div>
              <div>
                <dt>Targets with a name candidate</dt>
                <dd>{ratio(report.matched, 50)}</dd>
              </div>
              <div>
                <dt>Unambiguous name candidates</dt>
                <dd>{ratio(report.unique, 50)}</dd>
              </div>
              <div>
                <dt>Targets with any reference price</dt>
                <dd>{ratio(report.pricedTargets, 50)}</dd>
              </div>
              <div>
                <dt>Targets with a USD reference price</dt>
                <dd>{ratio(report.usdTargets, 50)}</dd>
              </div>
              <div>
                <dt>Matched records with any reference price</dt>
                <dd>
                  {ratio(
                    report.candidates.filter((row) => row.reference).length,
                    report.candidates.length,
                  )}
                </dd>
              </div>
              <div>
                <dt>Matched records with a USD reference price</dt>
                <dd>
                  {ratio(
                    report.candidates.filter(
                      (row) => row.reference?.currency === "USD",
                    ).length,
                    report.candidates.length,
                  )}
                </dd>
              </div>
              <div>
                <dt>Price observations with a reported date</dt>
                <dd>
                  {ratio(
                    report.candidates.filter(
                      (row) => row.reference && row.facts?.date,
                    ).length,
                    report.candidates.filter((row) => row.reference).length,
                  )}
                </dd>
              </div>
              <div>
                <dt>Verified US MSRP from provider</dt>
                <dd>{ratio(0, report.candidates.length)}</dd>
              </div>
              <div>
                <dt>Matched records with a primary image</dt>
                <dd>
                  {ratio(
                    report.candidates.filter((row) => row.media?.primary)
                      .length,
                    report.candidates.length,
                  )}
                </dd>
              </div>
              <div>
                <dt>All-target core completeness</dt>
                <dd>
                  {ratio(report.weightedCompleteness, 50 * coreFields.length)}
                </dd>
              </div>
              <div>
                <dt>Matched-record core completeness</dt>
                <dd>
                  {ratio(report.applicable - report.missing, report.applicable)}
                </dd>
              </div>
              <div>
                <dt>Numeric agreement on comparable observations</dt>
                <dd>
                  {ratio(report.correct, report.correct + report.incorrect)}
                </dd>
              </div>
            </dl>
            <p>
              Expanded raw fuel and power were checked for{" "}
              {
                report.candidates.filter(
                  (row) => row.facts?.expandedFieldsChecked,
                ).length
              }{" "}
              of {report.candidates.length} candidates. Completeness is a lower
              bound while any expanded checks remain outstanding.
            </p>
            <p>
              {report.applicable} matched-record core observations.{" "}
              {report.missing} missing, {report.correct} correct,{" "}
              {report.incorrect} incorrect, and {report.ambiguous} ambiguous or
              unchecked. Accuracy uses only independently comparable
              observations. Exact US identity remains unverified.
            </p>
            <Table
              caption="All target models and provider candidates"
              headers={[
                "Target",
                "Category",
                "Match and year confidence",
                "Provider candidates and photos",
                "Provider price",
                "Core specs and verification",
              ]}
              rows={report.results.map((row) => [
                <a href={row.official?.source ?? row.source} key="source">
                  {row.maker} {row.model} · {row.targetYear}
                </a>,
                row.category,
                <span key="match">
                  {row.classification}
                  <br />
                  {row.confidence}
                </span>,
                row.candidates.length
                  ? row.candidates.map((item) => {
                      const photo = photoById.get(item.id);
                      const notes = status?.[item.id];
                      return (
                        <p key={item.id}>
                          <Link href={providerLink(item.id)} prefetch={false}>
                            {item.id}
                          </Link>
                          <br />
                          {format(item.first)}–{item.last ?? "end unreported"} ·
                          primary {assetDisplay(item.media?.primary)} · gallery{" "}
                          {item.media?.gallery ?? "unverified"}
                          <br />
                          Photo{" "}
                          {notes?.classification ??
                            (photo?.loaded
                              ? "loaded, identity unverified"
                              : "unverified")}
                        </p>
                      );
                    })
                  : "Missing",
                row.candidates.length
                  ? row.candidates.map((item) => (
                      <p key={item.id}>
                        {item.reference
                          ? `${item.reference.currency} ${format(item.reference.amount)} · ${item.facts?.basis ?? "indicative reference"} · ${item.facts?.date ?? "date unreported"}`
                          : "Unavailable"}
                      </p>
                    ))
                  : "Unavailable",
                row.candidates.length
                  ? row.candidates.map((item) => (
                      <details key={item.id}>
                        <summary>
                          {ratio(
                            item.checks.filter(
                              (check) => check.status !== "missing",
                            ).length,
                            coreFields.length,
                          )}{" "}
                          populated
                        </summary>
                        {item.baseline && (
                          <p>
                            <a href={item.baseline.source}>
                              OEM baseline · {item.baseline.year}
                            </a>
                            {item.baseline.priceUsd != null && (
                              <>
                                {" "}
                                · USD {format(item.baseline.priceUsd)} ·{" "}
                                {item.baseline.priceBasis}
                              </>
                            )}
                          </p>
                        )}
                        <p>
                          Raw units {item.facts?.unit ?? "unreported"}. Length{" "}
                          {format(item.facts?.length)}, beam{" "}
                          {format(item.facts?.beam)}. Fuel raw{" "}
                          {format(item.facts?.fuel)}{" "}
                          {item.facts?.fuelUnit ?? "(unit unreported)"}.
                        </p>
                        <ul>
                          {item.checks.map((check) => (
                            <li key={check.field}>
                              {check.field} · {check.status} ·{" "}
                              {format(check.observed)} /{" "}
                              {format(check.expected)} {check.units} (provider /
                              OEM)
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))
                  : "Unavailable",
              ])}
            />
          </Section>
          <Section title="Photography quality">
            {photos ? (
              <>
                <dl className="research-specs">
                  <div>
                    <dt>Primary image present</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.primary),
                        photos.length,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Browser loaded</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.loaded),
                        photos.length,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Usable resolution</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.usable),
                        photos.length,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Identifiable named candidate model</dt>
                    <dd>
                      {ratio(
                        photoCounts(
                          (row) =>
                            status?.[row.id]?.classification === "identifiable",
                        ),
                        photos.length,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Passes resolution, conflict and watermark checks</dt>
                    <dd>
                      {status
                        ? ratio(
                            photoCounts(
                              (row) =>
                                row.usable &&
                                !!status[row.id] &&
                                status[row.id].classification !==
                                  "conflicting" &&
                                !status[row.id].watermark,
                            ),
                            photos.length,
                          )
                        : "Review pending"}
                    </dd>
                  </div>
                  <div>
                    <dt>Exact target-year photo verified</dt>
                    <dd>
                      {status ? ratio(0, photos.length) : "Review pending"}
                    </dd>
                  </div>
                  <div>
                    <dt>Gallery</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.gallery > 0),
                        photos.length,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Broken image</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.primary && !row.loaded),
                        photoCounts((row) => row.primary),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Exact rendered duplicates</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => row.duplicate),
                        photoCounts((row) => row.loaded),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Visible watermark</dt>
                    <dd>
                      {ratio(
                        photoCounts((row) => !!status?.[row.id]?.watermark),
                        photos.length,
                      )}
                    </dd>
                  </div>
                </dl>
                <Table
                  caption="Inspected model photographs"
                  headers={[
                    "Provider record",
                    "Rendered dimensions",
                    "Result",
                    "Image attribution metadata",
                  ]}
                  rows={photos.map((photo) => [
                    <Link
                      href={providerLink(photo.id)}
                      prefetch={false}
                      key={photo.id}
                    >
                      Image {photo.number}
                    </Link>,
                    `${photo.width} × ${photo.height}`,
                    status?.[photo.id]?.note ??
                      (photo.usable
                        ? "Usable resolution"
                        : "Unavailable or below threshold"),
                    `Alt ${assetDisplay(photo.alt)}, credit ${assetDisplay(photo.credit)}`,
                  ])}
                />
              </>
            ) : (
              <p>Browser photo audit has not run yet.</p>
            )}
          </Section>
          <Section title="Confirmed anomalies and source conflicts">
            <p>
              The 2025 GTX 170 baseline is 135.9 in overall and 49.2 in wide.
              The archived manufacturer page identifies a USD{" "}
              {format(gtx2025.priceUsd)} starting price.
            </p>
            <p>
              <a href={gtx2025.source}>US archived model</a> ·{" "}
              <a href={gtx2025Sheet}>North American specification sheet</a>
            </p>
            <Table
              caption="2025 Sea-Doo GTX 170 provider measurements"
              headers={[
                "Affected record",
                "Raw unit",
                "Raw length",
                "Provider metric length",
                "Raw beam",
              ]}
              rows={audit.anomalies.map((row) => [
                <Link key={row.id} href={providerLink(row.id)} prefetch={false}>
                  {row.model} {row.version}
                </Link>,
                row.facts.unit ?? "Unreported",
                format(row.facts.length),
                format(row.facts.metricLength),
                format(row.facts.beam),
              ])}
            />
            <p>
              The public provider page displays 41.42 m length and 15 m beam for
              this model. The OEM publishes 3.451 m length and 1.25 m beam. The
              raw 135.9 and 49.2 figures match the OEM’s inches and appear under
              the provider’s feet convention. Treat this as a provider-side
              unit/normalization conflict.
            </p>
            <p>
              <a href="https://theboatdb.com/boat/sea-doo-gtx-170-2025">
                Provider public specifications
              </a>
            </p>
            <p>
              Displacement is kept separate from dry weight. Untyped fuel
              volume, unmatched trim and dates outside the audited window remain
              unresolved.
            </p>
          </Section>
          <Section title="Independent manufacturer enrichment">
            <p>
              {oem.enrichmentPilot.length} independently sourced US
              configurations. Price labels preserve manufacturer basis and
              archived status.
            </p>
            <Table
              caption="Manufacturer enrichment pilot"
              headers={[
                "US configuration",
                "Length (in)",
                "Beam (in)",
                "Dry weight (lb)",
                "Seats",
                "Fuel (US gal)",
                "Price basis",
              ]}
              rows={oem.enrichmentPilot.map((row) => [
                <a href={row.source} key={row.model}>
                  {row.year} {row.maker} {row.model}
                </a>,
                format(row.lengthIn),
                format(row.beamIn),
                format(row.dryWeightLb),
                format(row.passenger),
                format(row.fuelUsGal),
                row.priceUsd
                  ? `$${format(row.priceUsd)} · ${row.priceBasis}`
                  : "Unavailable",
              ])}
            />
          </Section>
        </>
      )}
    </ShoppingPage>
  );
}
