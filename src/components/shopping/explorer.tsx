"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/formatting/money";
import {
  categoryMap,
  filterCatalog,
  sampleTerms,
  type ShoppingRecord,
} from "@/lib/marine/shopping";
import { CatalogCard } from "./catalog-ui";
import {
  FinanceFields,
  readBudget,
  sampleNote,
  useShoppingForm,
} from "./shopping-forms";

const blankFilters = {
  query: "",
  brand: "",
  category: "",
  year: "",
  minPrice: "",
  maxPrice: "",
  minLength: "",
  minHp: "",
  passengers: "",
  propulsion: "",
  sort: "name",
};
const optionalNumber = (text: string) =>
  text.trim() ? Number(text) : undefined;

export function Explorer({
  records,
  asOf,
  query = "",
  category = "",
  brand = "",
  openBudget = false,
}: {
  records: ShoppingRecord[];
  asOf: string;
  query?: string;
  category?: string;
  brand?: string;
  openBudget?: boolean;
}) {
  const fieldPrefix = useId();
  const [filters, setFilters] = useState({
    ...blankFilters,
    query,
    category,
    brand,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [budgetOn, setBudgetOn] = useState(openBudget);
  const form = useShoppingForm();
  const budget = budgetOn ? readBudget(form.values) : undefined;
  const brands = [
    ...new Map(
      records.map(({ manufacturer }) => [manufacturer.id, manufacturer.name]),
    ),
  ];
  const years = [
    ...new Set(records.map(({ modelYear }) => modelYear.year)),
  ].sort((a, b) => b - a);
  const propulsion = [
    ...new Set(
      records.flatMap(({ variant }) =>
        variant.specs.engine.value?.type
          ? [variant.specs.engine.value.type]
          : [],
      ),
    ),
  ];
  const maxPrice = optionalNumber(filters.maxPrice);
  const rows = budget?.note
    ? []
    : filterCatalog(
        records,
        {
          ...filters,
          year: optionalNumber(filters.year),
          minPrice: optionalNumber(filters.minPrice),
          maxPrice:
            budget?.cap !== undefined
              ? Math.min(maxPrice ?? Infinity, budget.cap)
              : maxPrice,
          minHp: optionalNumber(filters.minHp),
          minLength: optionalNumber(filters.minLength),
          passengers: optionalNumber(filters.passengers),
        },
        asOf,
        budget?.terms ?? sampleTerms,
      );

  function select(
    key: keyof typeof blankFilters,
    label: string,
    choices: Array<[string, string]>,
    blank = true,
  ) {
    return (
      <div className="tool-select">
        <label htmlFor={fieldPrefix + key}>{label}</label>
        <select
          id={fieldPrefix + key}
          value={filters[key]}
          onChange={(e) => change(key, e.target.value)}
        >
          {blank && <option value="">Any</option>}
          {choices.map(([value, title]) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </select>
      </div>
    );
  }
  function change(key: keyof typeof blankFilters, value: string) {
    setFilters((state) => ({ ...state, [key]: value }));
  }
  return (
    <div className="catalog-explorer">
      <div className="catalog-search-row">
        <label className="tool-select">
          Search manufacturer or model
          <input
            type="search"
            value={filters.query}
            onChange={(e) => change("query", e.target.value)}
            placeholder="e.g. Sea-Doo Switch"
          />
        </label>
        {select(
          "sort",
          "Sort by",
          [
            ["name", "Model name"],
            ["year", "Newest model year"],
            ["price", "Starting price"],
            ["payment", "Monthly financing"],
          ],
          false,
        )}
      </div>
      <details className="tool-details catalog-disclosure">
        <summary>Filter boats</summary>
        <div className="shop-fields">
          {select(
            "category",
            "Boat type",
            Object.entries(categoryMap).map(([key, item]) => [key, item.label]),
          )}
          {select("brand", "Manufacturer", brands)}
          {select(
            "year",
            "Model year",
            years.map((year) => [String(year), String(year)]),
          )}
          {select(
            "propulsion",
            "Propulsion",
            propulsion.map((kind) => [kind, kind]),
          )}
          {(
            [
              ["minPrice", "Minimum price ($)"],
              ["maxPrice", "Maximum price ($)"],
              ["minHp", "Minimum installed horsepower"],
              ["minLength", "Minimum length (ft)"],
              ["passengers", "Minimum passenger capacity"],
            ] as const
          ).map(([key, label]) => (
            <label className="tool-select" key={key}>
              {label}
              <input
                type="number"
                min="0"
                step="any"
                value={filters[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </details>
      <details
        className="tool-details catalog-disclosure"
        open={openBudget || undefined}
      >
        <summary>Shop by budget</summary>
        <div className="catalog-budget">
          <p className="catalog-note">
            The initial values are illustrative. Enter your own monthly budget
            and operating estimate.
          </p>
          <FinanceFields form={form} budget />
          <label className="research-toggle">
            <input
              type="checkbox"
              checked={budgetOn}
              onChange={(e) => setBudgetOn(e.target.checked)}
            />{" "}
            Match boats to my budget
          </label>
          {budget && (
            <p role="status">
              {budget.note ??
                `Estimated purchase-price ceiling ${money(budget.cap!)}`}
            </p>
          )}
          <p>
            Starting prices may exclude freight, preparation, registration,
            accessories and options. This is a budgeting estimate. Taxes and
            fees are assumed paid upfront.
          </p>
        </div>
      </details>
      <div className="catalog-toolbar">
        <p role="status">
          {rows.length} {rows.length === 1 ? "variant" : "variants"} found
        </p>
        <button
          type="button"
          className="tool-secondary"
          onClick={() => {
            setFilters(blankFilters);
            setBudgetOn(false);
            form.reset();
            setSelected([]);
          }}
        >
          Clear filters
        </button>
        {selected.length >= 2 && (
          <Link
            className="button"
            href={`/compare?models=${selected.join(",")}`}
          >
            Compare {selected.length} boats
          </Link>
        )}
      </div>
      <p className="catalog-note">
        {budget?.terms
          ? "Estimates use your budget assumptions."
          : `Illustrative financing · ${sampleNote}`}
      </p>
      <p className="catalog-note">
        Select two or three boats to compare. {selected.length} selected.
      </p>
      {!rows.length && (
        <p className="catalog-empty">
          {budget?.note ??
            "No boats match these filters. Try a wider range or clear your filters."}
        </p>
      )}
      <div className="catalog-grid">
        {rows.map((record) => (
          <CatalogCard
            key={record.variant.id}
            record={record}
            asOf={asOf}
            terms={budget?.terms ?? sampleTerms}
            operating={budget?.terms?.operating}
          >
            <label className="research-toggle">
              <input
                type="checkbox"
                checked={selected.includes(record.variant.id)}
                disabled={
                  selected.length === 3 && !selected.includes(record.variant.id)
                }
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, record.variant.id]
                      : selected.filter((x) => x !== record.variant.id),
                  )
                }
              />
              Compare{" "}
              <span className="sr-only">
                {record.modelYear.year} {record.manufacturer.name}{" "}
                {record.model.name} {record.variant.name}
              </span>
            </label>
          </CatalogCard>
        ))}
      </div>
    </div>
  );
}
