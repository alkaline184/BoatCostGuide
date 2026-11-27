"use client";

import { useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NumericField } from "../ui/numeric-field";
import { money } from "@/lib/formatting/money";
import { readNumber } from "@/lib/validation/boat-cost";
import { requireChoice, type PaymentRow } from "@/lib/finance/loan";

export function useScenario(defaults: Record<string, string>) {
  const [fields, setFields] = useState(defaults);
  const id = useId();
  const set = (key: string, value: string) =>
    setFields((state) => ({ ...state, [key]: value }));
  return {
    fields,
    set,
    load(values: Record<string, string>) {
      setFields({ ...defaults, ...values });
    },
    reset() {
      setFields(defaults);
    },
    n(key: string) {
      return readNumber(fields[key]);
    },
    field(key: string, label: string, unit = "$", hint?: string, max?: number) {
      const number = readNumber(fields[key]);
      const error = !Number.isFinite(number)
        ? "Enter a nonnegative number."
        : max !== undefined && number > max
          ? `Enter a value up to ${max.toLocaleString("en-US")}.`
          : undefined;
      return (
        <NumericField
          id={`${id}-${key}`}
          label={label}
          unit={unit}
          hint={hint}
          error={error}
          value={fields[key]}
          onChange={(value) => set(key, value)}
        />
      );
    },
    choice(
      key: string,
      label: string,
      options: ReadonlyArray<readonly [string, string]>,
    ) {
      return (
        <label className="tool-select">
          {label}
          <select
            value={fields[key]}
            onChange={(event) => set(key, event.target.value)}
          >
            {options.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
      );
    },
  };
}

export type Scenario = ReturnType<typeof useScenario>;
type Transfer = { destination: string; values: Record<string, string> };
let pending: Transfer | undefined;

export function TransferButton({
  destination,
  values,
  children,
}: Transfer & { children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="tool-secondary"
      onClick={() => {
        pending = { destination, values };
        router.push(destination);
      }}
    >
      {children}
    </button>
  );
}

export function ImportScenario({
  path,
  scenario,
  keys,
}: {
  path: string;
  scenario: Scenario;
  keys: string[];
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="import-scenario">
      <button
        type="button"
        className="tool-secondary"
        onClick={() => {
          if (pending?.destination !== path) {
            setMessage("No scenario was sent to this calculator.");
            return;
          }
          const values = Object.fromEntries(
            Object.entries(pending.values).filter(
              ([key, value]) =>
                keys.includes(key) && Number.isFinite(readNumber(value)),
            ),
          );
          scenario.load(values);
          pending = undefined;
          setMessage(
            "Scenario loaded. Review the values before using the estimate.",
          );
        }}
      >
        Load transferred scenario
      </button>
      <span role="status">{message}</span>
    </div>
  );
}

export function evaluate<T>(
  calculate: () => T,
): { result: T; error?: undefined } | { result?: undefined; error: string } {
  try {
    return { result: calculate() };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { error: error.message };
  }
}

export function CalculatorPanel({
  title,
  summary,
  error,
  inputs,
  children,
  reset,
}: {
  title: string;
  summary: string;
  error?: string;
  inputs: ReactNode;
  children?: ReactNode;
  reset: () => void;
}) {
  return (
    <section
      className="calculator tool-panel"
      aria-label="Interactive calculator"
    >
      <div className="calculator-inputs">
        <div className="tool-mobile-summary" aria-hidden="true">
          <strong>{title}</strong>
          <span>{error ?? summary}</span>
        </div>
        <h2>Scenario inputs</h2>
        <p className="calculator-intro">
          Illustrative starting values. Enter your own figures.
        </p>
        <div className="fields">{inputs}</div>
        <button type="button" className="reset-button" onClick={reset}>
          Reset calculator
        </button>
      </div>
      <div className="calculator-results">
        <h2>{title}</h2>
        <p role="status" className="tool-status">
          {error ?? <strong className="monthly-total">{summary}</strong>}
        </p>
        {children}
      </div>
    </section>
  );
}

export function Readout({
  items,
}: {
  items: Array<[string, string | number]>;
}) {
  return (
    <dl className="result-details">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{typeof value === "number" ? money(value) : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Breakdown({ items }: { items: Array<[string, number]> }) {
  const total = items.reduce((sum, [, value]) => sum + value, 0);
  return (
    <ul className="tool-breakdown" aria-label="Expense breakdown">
      {items.map(([label, value]) => (
        <li key={label}>
          <span>{label}</span>
          <strong>{money(value)}</strong>
          <span className="tool-bar" aria-hidden="true">
            <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BalanceChart({
  series,
}: {
  series: Array<{ label: string; principal: number; rows: PaymentRow[] }>;
}) {
  const max = Math.max(1, ...series.map(({ principal }) => principal));
  const duration = Math.max(1, ...series.map(({ rows }) => rows.length));
  return (
    <figure className="tool-chart">
      <figcaption>
        <strong>Remaining balance over time</strong>
      </figcaption>
      <svg
        viewBox="0 0 360 100"
        role="img"
        aria-label={series
          .map(
            ({ label, principal, rows }) =>
              `${label}: starts at ${money(principal)}, repaid in ${rows.length} months.`,
          )
          .join(" ")}
      >
        <path d="M4 4v92h352" fill="none" stroke="#a2bbc0" />
        {series.map(({ label, principal, rows }, i) => (
          <polyline
            key={label}
            fill="none"
            stroke={i ? "#355d9c" : "#08756d"}
            strokeDasharray={i ? "6 3" : undefined}
            strokeWidth="2.5"
            points={[
              [4, 96 - (principal / max) * 92],
              ...rows.map((row) => [
                4 + (row.number / duration) * 352,
                96 - (row.balance / max) * 92,
              ]),
            ]
              .map((pair) => pair.join(","))
              .join(" ")}
          />
        ))}
      </svg>
      <ul>
        {series.map(({ label, principal, rows }) => (
          <li key={label}>
            {label} · {money(principal)} at start · $0.00 after {rows.length}{" "}
            months
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Schedule({ rows, name }: { rows: PaymentRow[]; name: string }) {
  const [view, setView] = useState("annual");
  const [page, setPage] = useState(0);
  const current = Math.min(page, Math.max(0, Math.ceil(rows.length / 12) - 1));
  if (!rows.length)
    return <p>No scheduled payments for {name.toLowerCase()}.</p>;
  const summary = [];
  for (let start = 0; start < rows.length; start += 12) {
    const year = rows.slice(start, start + 12);
    const last = year[year.length - 1];
    summary.push({
      number: start / 12 + 1,
      payment: year.reduce((sum, row) => sum + row.payment, 0),
      principal: year.reduce((sum, row) => sum + row.principal, 0),
      interest: year.reduce((sum, row) => sum + row.interest, 0),
      balance: last.balance,
      cumulativeInterest: last.cumulativeInterest,
    });
  }
  function download() {
    const data = [
      "Payment number,Payment,Principal paid,Interest paid,Remaining balance,Cumulative interest",
      ...rows.map((row) =>
        [
          row.number,
          ...[
            row.payment,
            row.principal,
            row.interest,
            row.balance,
            row.cumulativeInterest,
          ].map((value) => value.toFixed(2)),
        ].join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="tool-details">
      <summary>{name}</summary>
      <div className="schedule-actions">
        <label>
          Schedule view{" "}
          <select
            value={view}
            onChange={(event) => {
              setView(event.target.value);
              setPage(0);
            }}
          >
            <option value="annual">Annual summary</option>
            <option value="monthly">Monthly detail</option>
          </select>
        </label>
        <button className="tool-secondary" type="button" onClick={download}>
          Download CSV
        </button>
      </div>
      {view === "monthly" && (
        <div className="schedule-actions">
          <button
            className="tool-secondary"
            type="button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous year
          </button>
          <span>
            Year {current + 1} of {Math.ceil(rows.length / 12)}
          </span>
          <button
            className="tool-secondary"
            type="button"
            disabled={(current + 1) * 12 >= rows.length}
            onClick={() => setPage(current + 1)}
          >
            Next year
          </button>
        </div>
      )}
      <div className="tool-table" role="region" aria-label={name} tabIndex={0}>
        <table>
          <caption>
            {name} ·{" "}
            {view === "annual"
              ? "annual summary"
              : `year ${current + 1} monthly detail`}
          </caption>
          <thead>
            <tr>
              {[
                view === "annual" ? "Year" : "Payment number",
                "Payment",
                "Principal paid",
                "Interest paid",
                "Remaining balance",
                "Cumulative interest",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(view === "annual"
              ? summary
              : rows.slice(current * 12, current * 12 + 12)
            ).map((row) => (
              <tr key={row.number}>
                <th scope="row">{row.number}</th>
                {[
                  row.payment,
                  row.principal,
                  row.interest,
                  row.balance,
                  row.cumulativeInterest,
                ].map((value, index) => (
                  <td key={index}>{money(value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export const downOptions = [
  ["amount", "US dollars"],
  ["percent", "Percent of price"],
] as const;
export function termFields(s: Scenario) {
  return (
    <div className="paired-fields">
      {s.field(
        "annualRate",
        "Annual interest rate",
        "%",
        "Nominal interest rate",
        35,
      )}
      {s.field("term", "Loan term", s.fields.termUnit)}
      {s.choice("termUnit", "Term unit", [
        ["years", "Years"],
        ["months", "Months"],
      ])}
    </div>
  );
}
export function terms(s: Scenario) {
  requireChoice(s.fields.termUnit, ["years", "months"], "term unit");
  return {
    annualRate: s.n("annualRate"),
    months: s.n("term") * (s.fields.termUnit === "years" ? 12 : 1),
  };
}
export function downFields(s: Scenario) {
  return (
    <div className="paired-fields">
      {s.field(
        "down",
        "Down payment",
        s.fields.downMode === "percent" ? "%" : "$",
      )}
      {s.choice("downMode", "Down payment unit", downOptions)}
    </div>
  );
}
