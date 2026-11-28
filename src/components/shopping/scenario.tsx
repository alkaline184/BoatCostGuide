"use client";

import { useState } from "react";
import Link from "next/link";
import { money } from "@/lib/formatting/money";
import {
  costProjection,
  modelPath,
  startingPrice,
  validateComparison,
  type ShoppingRecord,
} from "@/lib/marine/shopping";
import { readNumber } from "@/lib/validation/boat-cost";
import { CatalogImage, specRows } from "./catalog-ui";
import {
  budgetValues,
  FinanceFields,
  useShoppingForm,
  type FormValues,
} from "./shopping-forms";

function projection(form: FormValues, officialPrice?: number) {
  const price = form.price.trim() ? readNumber(form.price) : officialPrice;
  if (price === undefined || !form.operating.trim())
    return { note: "Enter purchase price and monthly operating expenses." };
  try {
    return {
      price,
      result: costProjection(
        price,
        budgetValues(form),
        form.resale.trim() ? readNumber(form.resale) : undefined,
      ),
    };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { note: error.message };
  }
}
const costLabels = [
  "Purchase price used",
  "Monthly financing",
  "Monthly operating expenses",
  "Monthly cash outflow",
  "Five-year cash outflow before sale",
  "Remaining loan after five years",
  "Net ownership cost after sale",
] as const;

function costRows(values: ReturnType<typeof projection>) {
  return values.result
    ? [
        money(values.price!),
        money(values.result.payment),
        money(values.result.operating),
        money(values.result.monthly),
        money(values.result.periodCash),
        money(values.result.balance),
        values.result.net === null
          ? "Enter a resale estimate"
          : money(values.result.net),
      ]
    : null;
}
const basis =
  "Five-year cash outflow includes down payment, upfront acquisition charges, scheduled payments due in five years, and your operating expenses. With resale entered, net cost adds remaining principal and subtracts resale proceeds.";

export function ModelScenario({ price }: { price?: number }) {
  const form = useShoppingForm({
    price: price === undefined ? "" : String(price),
    operating: "",
  });
  const calculated = projection(form.values);
  const costs = costRows(calculated);
  return (
    <section className="catalog-scenario" aria-labelledby="scenario-heading">
      <h2 id="scenario-heading">Model your ownership costs</h2>
      <p>
        Use a dealer quote and your own operating expenses. Enter your estimate
        for fuel, storage, insurance and upkeep in the monthly figure. Loan
        inputs are editable examples.
      </p>
      <FinanceFields form={form} price resale />
      <div role="status">
        {costs ? (
          <dl className="research-specs">
            {costs.map((value, index) => (
              <div key={costLabels[index]}>
                <dt>{costLabels[index]}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{calculated.note}</p>
        )}
      </div>
      <p className="catalog-note">{basis}</p>
      <button type="button" className="reset-button" onClick={form.reset}>
        Reset assumptions
      </button>
    </section>
  );
}

function ColumnScenario({
  title,
  form,
}: {
  title: string;
  form: ReturnType<typeof useShoppingForm>;
}) {
  return (
    <fieldset className="catalog-scenario">
      <legend>{title}</legend>
      <FinanceFields form={form} price resale />
      <button type="button" className="reset-button" onClick={form.reset}>
        Reset assumptions
      </button>
    </fieldset>
  );
}

function ComparePanel({
  selected,
  asOf,
}: {
  selected: ShoppingRecord[];
  asOf: string;
}) {
  const [shared, setShared] = useState(true);
  const common = useShoppingForm({ operating: "" });
  const first = useShoppingForm({
    operating: "",
    price: String(startingPrice(selected[0], asOf)?.amount ?? ""),
  });
  const second = useShoppingForm({
    operating: "",
    price: String(startingPrice(selected[1], asOf)?.amount ?? ""),
  });
  const third = useShoppingForm({
    operating: "",
    price: selected[2]
      ? String(startingPrice(selected[2], asOf)?.amount ?? "")
      : "",
  });
  const forms = [first, second, third];
  const values = selected.map((record, i) =>
    projection(
      shared ? common.values : forms[i].values,
      shared ? startingPrice(record, asOf)?.amount : undefined,
    ),
  );
  const rows = selected.map(specRows);
  const moneyRows = values.map(costRows);
  return (
    <>
      <p className="catalog-note">
        Starting prices may exclude destination charges and options. Cost
        assumptions stay on this page.
      </p>
      <label className="research-toggle">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
        />{" "}
        Use shared financing and operating assumptions
      </label>
      {shared && (
        <section
          className="catalog-scenario"
          aria-label="Shared cost assumptions"
        >
          <h2>Shared assumptions</h2>
          <p>Each boat uses its own observed starting price.</p>
          <FinanceFields form={common} resale />
          <button type="button" className="reset-button" onClick={common.reset}>
            Reset assumptions
          </button>
        </section>
      )}
      <div
        className="tool-table research-comparison catalog-table"
        role="region"
        aria-label="Side-by-side boat comparison"
        tabIndex={0}
      >
        <table>
          <caption>Specifications and five-year cost scenarios</caption>
          <thead>
            <tr>
              <th scope="col">Boat</th>
              {selected.map((record) => (
                <th key={record.variant.id} scope="col">
                  <CatalogImage record={record} asOf={asOf} />
                  <Link
                    href={modelPath(record) + "?variant=" + record.variant.id}
                  >
                    {record.modelYear.year} {record.manufacturer.name}{" "}
                    {record.model.name}
                  </Link>
                  <p>{record.variant.name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Manufacturer price</th>
              {selected.map((record) => {
                const price = startingPrice(record, asOf);
                return (
                  <td key={record.variant.id}>
                    {price ? money(price.amount) : "Unavailable"}
                  </td>
                );
              })}
            </tr>
            {rows[0].map(([label], index) => {
              const differs =
                rows.every((boat) => boat[index][1] !== "Unavailable") &&
                new Set(rows.map((boat) => boat[index][1])).size > 1;
              return (
                <tr key={label}>
                  <th scope="row">
                    {label}
                    {differs && (
                      <small className="comparison-diff">Differs</small>
                    )}
                  </th>
                  {rows.map((boat, i) => (
                    <td key={selected[i].variant.id}>{boat[index][1]}</td>
                  ))}
                </tr>
              );
            })}
            {!shared && (
              <tr>
                <th scope="row">Cost assumptions</th>
                {selected.map((record, i) => (
                  <td key={record.variant.id}>
                    <ColumnScenario
                      title={record.model.name + " assumptions"}
                      form={forms[i]}
                    />
                  </td>
                ))}
              </tr>
            )}
            <tr>
              <th scope="row">Projection status</th>
              {values.map((value, i) => (
                <td key={selected[i].variant.id}>
                  {value.note ?? "Estimate ready"}
                </td>
              ))}
            </tr>
            {costLabels.map((label, j) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {moneyRows.map((row, i) => (
                  <td key={selected[i].variant.id}>
                    {row?.[j] ?? "Unavailable"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {values.filter(({ result }) => result).length >= 2 && (
        <figure className="catalog-cost-chart">
          <figcaption>Five-year cash outflow before sale</figcaption>
          <ul>
            {values.map(
              ({ result }, index) =>
                result && (
                  <li key={selected[index].variant.id}>
                    <span>
                      {selected[index].modelYear.year}{" "}
                      {selected[index].model.name}
                    </span>
                    <meter
                      aria-hidden="true"
                      min={0}
                      max={Math.max(
                        1,
                        ...values.map((value) => value.result?.periodCash ?? 0),
                      )}
                      value={result.periodCash}
                    />
                    <strong>{money(result.periodCash)}</strong>
                  </li>
                ),
            )}
          </ul>
        </figure>
      )}
      <p className="catalog-note">{basis}</p>
    </>
  );
}

export function CompareBoats({
  records,
  initial,
  asOf,
}: {
  records: ShoppingRecord[];
  initial: string[];
  asOf: string;
}) {
  const [ids, setIds] = useState(initial);
  const [copy, setCopy] = useState("");
  const selected = ids.map((id) =>
    records.find(({ variant }) => variant.id === id)!,
  );
  function change(index: number, value: string) {
    const next = [...ids];
    next[index] = value;
    const usable = validateComparison(next, records);
    setIds(usable);
    setCopy("");
    window.history.replaceState(
      null,
      "",
      usable.length ? "/compare?models=" + usable.join(",") : "/compare",
    );
  }
  return (
    <>
      <div className="shop-fields catalog-picker">
        {[0, 1, 2].map((index) => (
          <label className="tool-select" key={index}>
            Boat {index + 1}
            <select
              value={ids[index] ?? ""}
              onChange={(e) => change(index, e.target.value)}
            >
              <option value="">Choose a model</option>
              {records.map((record) => (
                <option
                  key={record.variant.id}
                  value={record.variant.id}
                  disabled={
                    ids.includes(record.variant.id) &&
                    ids[index] !== record.variant.id
                  }
                >
                  {record.modelYear.year} {record.manufacturer.name}{" "}
                  {record.model.name} · {record.variant.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {selected.length < 2 ? (
        <p className="catalog-empty">Choose two or three models to compare.</p>
      ) : (
        <>
          <button
            type="button"
            className="tool-secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  new URL(
                    "/compare?models=" + ids.join(","),
                    window.location.origin,
                  ).href,
                );
                setCopy("Comparison link copied.");
              } catch {
                setCopy("Copy the model-only link from your address bar.");
              }
            }}
          >
            Copy model comparison link
          </button>
          <p role="status">{copy}</p>
          <ComparePanel key={ids.join(",")} selected={selected} asOf={asOf} />
        </>
      )}
    </>
  );
}
