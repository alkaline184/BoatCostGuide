"use client";

import { useState } from "react";
import type { CatalogRecord } from "@/lib/marine/catalog";
import { ModelCard, boatSpecs } from "./boat-record";
import { ScenarioFields } from "./scenario-fields";

export function FavoriteButton({ label }: { label: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      className="tool-secondary"
      aria-pressed={saved}
      onClick={() => setSaved(!saved)}
    >
      {saved ? "Remove favorite" : "Favorite"} · {label}
    </button>
  );
}

export function Comparison({
  records,
}: {
  records: readonly [CatalogRecord, CatalogRecord, CatalogRecord];
}) {
  const [showThird, setThird] = useState(true);
  const selected = showThird ? records : records.slice(0, 2);
  const specifications = selected.map(boatSpecs);

  return (
    <>
      <label className="research-toggle">
        <input
          type="checkbox"
          checked={showThird}
          onChange={(event) => setThird(event.target.checked)}
        />{" "}
        Include {records[2].model.name}
      </label>
      <div
        className="tool-table research-comparison"
        role="region"
        aria-label="Side-by-side boat comparison"
        tabIndex={0}
      >
        <table>
          <caption>Technical specifications and scenario costs</caption>
          <thead>
            <tr>
              <th scope="col">Boat</th>
              {selected.map((record) => (
                <th scope="col" key={record.variant.id}>
                  <ModelCard record={record} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specifications[0].map(([name], index) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                {specifications.map((specs, recordIndex) => (
                  <td key={selected[recordIndex].variant.id}>
                    {specs[index][1]}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">
                User-entered
                <br />
                cost assumptions
              </th>
              {selected.map((record) => (
                <td key={record.variant.id}>
                  <ScenarioFields
                    title={record.model.name + " ownership scenario"}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
