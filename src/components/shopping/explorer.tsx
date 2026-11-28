"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  catalogPageSize,
  type CatalogPage,
  type catalogFacets,
} from "@/lib/marine/catalog-search";
import { money } from "@/lib/formatting/money";
import { categoryMap, sampleTerms, startingPrice } from "@/lib/marine/shopping";
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
export function Explorer({
  initial,
  facets,
  manufacturerScope = "",
  typeScope = "",
  asOf,
  query = "",
  category = "",
  brand = "",
  openBudget = false,
}: {
  initial: CatalogPage;
  facets: ReturnType<typeof catalogFacets>;
  manufacturerScope?: string;
  typeScope?: string;
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
  const { brands, years, propulsion } = facets;
  const [results, setResults] = useState(initial);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const cap = budget?.cap;
  const resultParams = new URLSearchParams({
    ...filters,
    priceIndex: budgetOn ? "1" : "",
    page: String(page),
    manufacturerScope,
    typeScope,
  }).toString();
  const budgetInvalid = Boolean(budget?.note);
  useEffect(() => {
    if (budgetInvalid) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/boats?" + resultParams, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Catalog search failed");
        const data = (await response.json()) as CatalogPage;
        if (!controller.signal.aborted) {
          setResults(data);
          setLoaded(true);
          setUnavailable(false);
        }
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [resultParams, budgetInvalid]);
  const budgetCount =
    budgetOn && cap !== undefined
      ? (results.prices?.filter((amount) => amount <= cap).length ?? 0)
      : null;
  const rows =
    budgetInvalid || unavailable
      ? []
      : results.rows.filter(
          (record) =>
            cap === undefined ||
            (startingPrice(record, asOf)?.amount ?? Infinity) <= cap,
        );
  const count =
    budgetInvalid || unavailable ? 0 : (budgetCount ?? results.count);
  const last =
    budgetCount === null
      ? results.last
      : Math.max(1, Math.ceil(budgetCount / catalogPageSize));
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
          value={key === "sort" && budgetOn ? "price" : filters[key]}
          disabled={key === "sort" && budgetOn}
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
    setPage(1);
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
        <div className="catalog-budget" onChangeCapture={() => setPage(1)}>
          <p className="catalog-note">
            The initial values are illustrative. Enter your own monthly budget
            and operating estimate.
          </p>
          <FinanceFields form={form} budget />
          <label className="research-toggle">
            <input
              type="checkbox"
              checked={budgetOn}
              onChange={(e) => {
                setPage(1);
                setBudgetOn(e.target.checked);
              }}
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
          {count} {count === 1 ? "variant" : "variants"} found
        </p>
        <button
          type="button"
          className="tool-secondary"
          onClick={() => {
            setPage(1);
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
            (unavailable
              ? "Catalog search is temporarily unavailable."
              : "No boats match these filters. Try a wider range or clear your filters.")}
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
      {count > 0 && last > 1 && (
        <nav className="catalog-toolbar" aria-label="Boat results pages">
          <button
            type="button"
            className="tool-secondary"
            disabled={!loaded || results.current <= 1}
            onClick={() => setPage(results.current - 1)}
          >
            Previous
          </button>
          <span>
            Page {results.current} of {last}
          </span>
          <button
            type="button"
            className="tool-secondary"
            disabled={!loaded || results.current >= last}
            onClick={() => setPage(results.current + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
