"use client";

import { useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";
import { NumericField } from "@/components/ui/numeric-field";
import {
  calculateBoatCost,
  downPaymentAmount,
  downPaymentPercent,
  illustrativeInputs,
} from "@/lib/finance/boat-cost";
import { money } from "@/lib/formatting/money";
import {
  readNumber,
  validateBoatCost,
  type DownPaymentMode,
} from "@/lib/validation/boat-cost";

const defaults = {
  price: String(illustrativeInputs.price),
  downPayment: String(illustrativeInputs.downPayment),
  annualRate: String(illustrativeInputs.annualRate),
  years: String(illustrativeInputs.years),
  operating: String(illustrativeInputs.operating),
};

const detailRows = [
  ["Amount financed", "principal"],
  ["Annual recurring cash outflow", "annualTotal"],
  ["Total loan interest", "totalInterest"],
  ["Total scheduled loan payments", "scheduledPayments"],
] as const;

export function BoatCostCalculator() {
  const [fields, setFields] = useState(defaults);
  const [mode, setMode] = useState<DownPaymentMode>(
    illustrativeInputs.downPaymentMode,
  );
  const [exactConversion, setExactConversion] = useState<number>();
  const inputs = {
    price: readNumber(fields.price),
    downPayment: exactConversion ?? readNumber(fields.downPayment),
    downPaymentMode: mode,
    annualRate: readNumber(fields.annualRate),
    years: readNumber(fields.years),
    operating: readNumber(fields.operating),
  };
  const errors = validateBoatCost(inputs);
  const result = Object.keys(errors).length
    ? undefined
    : calculateBoatCost(inputs);
  const loanShare =
    result && result.monthlyTotal > 0
      ? (result.monthlyLoan / result.monthlyTotal) * 100
      : 0;
  const cash = result?.principal === 0;

  function fieldProps(key: keyof typeof fields) {
    return {
      id: key,
      value: fields[key],
      error: errors[key],
      onChange(value: string) {
        if (key === "downPayment") {
          setExactConversion(undefined);
        }
        setFields((previous) => ({ ...previous, [key]: value }));
      },
    };
  }

  function changeMode(next: DownPaymentMode) {
    if (
      next === mode ||
      errors.price ||
      errors.downPayment ||
      inputs.price === 0
    )
      return;
    const amount = downPaymentAmount(inputs.price, inputs.downPayment, mode);
    const converted =
      next === "amount" ? amount : downPaymentPercent(inputs.price, amount);
    setExactConversion(converted);
    setFields((previous) => ({
      ...previous,
      downPayment: new Intl.NumberFormat("en-US", {
        maximumFractionDigits: next === "amount" ? 2 : 6,
        useGrouping: false,
      }).format(converted),
    }));
    setMode(next);
  }

  function reset() {
    setFields(defaults);
    setMode(illustrativeInputs.downPaymentMode);
    setExactConversion(undefined);
  }

  return (
    <section
      id="calculator"
      className="calculator"
      aria-labelledby="calculator-title"
    >
      <div className="calculator-inputs">
        <div className="calculator-heading">
          <div className="icon-tile">
            <Calculator size={20} aria-hidden="true" />
          </div>
          <h2 id="calculator-title">Boat cost calculator</h2>
        </div>
        <p className="calculator-intro">
          Adjust the example to model your boat.
        </p>
        <div className="fields">
          <NumericField
            {...fieldProps("price")}
            label="Boat purchase price"
            unit="$"
          />
          <NumericField
            {...fieldProps("downPayment")}
            label="Down payment"
            unit={mode === "amount" ? "$" : "%"}
            accessory={
              <div
                className="segmented"
                role="group"
                aria-label="Down payment unit"
              >
                <button
                  type="button"
                  disabled={Boolean(
                    errors.price || errors.downPayment || inputs.price === 0,
                  )}
                  aria-label="Enter down payment in dollars"
                  aria-pressed={mode === "amount"}
                  onClick={() => changeMode("amount")}
                >
                  $
                </button>
                <button
                  type="button"
                  disabled={Boolean(
                    errors.price || errors.downPayment || inputs.price === 0,
                  )}
                  aria-label="Enter down payment as a percentage"
                  aria-pressed={mode === "percent"}
                  onClick={() => changeMode("percent")}
                >
                  %
                </button>
              </div>
            }
          />
          <div className="paired-fields">
            <NumericField
              {...fieldProps("annualRate")}
              label="Annual interest rate"
              unit="%"
            />
            <NumericField
              {...fieldProps("years")}
              label="Loan term"
              unit="years"
              whole
            />
          </div>
          <NumericField
            {...fieldProps("operating")}
            label="Monthly operating expenses"
            unit="$"
            hint="Budget for fuel, insurance, storage and upkeep."
          />
        </div>
        <button className="reset-button" type="button" onClick={reset}>
          <RotateCcw size={15} aria-hidden="true" /> Reset calculator
        </button>
      </div>
      <div className="calculator-results">
        <h3>Estimated monthly cash outflow</h3>
        <div role="status" aria-atomic="true" className="sr-only">
          {result
            ? `Monthly cash outflow ${money(result.monthlyTotal)}. Loan payment ${money(result.monthlyLoan)}. Operating expenses ${money(result.monthlyOperating)}.`
            : "Correct the highlighted fields to see an estimate."}
        </div>
        <div className="monthly-total" data-testid="monthly-total">
          {result ? money(result.monthlyTotal) : "—"}
        </div>
        <div
          className="breakdown"
          aria-hidden="true"
          style={{
            background:
              result && result.monthlyTotal > 0
                ? `linear-gradient(to right, var(--mint) ${loanShare}%, var(--chart-blue) ${loanShare}%)`
                : undefined,
          }}
        />
        <dl className="legend">
          <div>
            <dt>
              <span className="swatch loan" /> Loan payment
            </dt>
            <dd>{result ? money(result.monthlyLoan) : "—"}</dd>
          </div>
          <div>
            <dt>
              <span className="swatch operating" /> Operating expenses
            </dt>
            <dd>{result ? money(result.monthlyOperating) : "—"}</dd>
          </div>
        </dl>
        <dl className="result-details">
          {detailRows.map(([label, key]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{result ? money(result[key]) : "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="result-note">
          {cash
            ? "This scenario has no financing. "
            : "Assumes a fixed rate and monthly payments. "}
          Cash flow excludes the down payment, lender fees and depreciation.
          Taxes and other expenses are included only if entered.{" "}
          <a href="/methodology">See methodology</a>
        </p>
      </div>
    </section>
  );
}
