"use client";

import { useId, useState } from "react";
import { NumericField } from "../ui/numeric-field";
import { projectFiveYears } from "@/lib/marine/scenario";
import { money } from "@/lib/formatting/money";
import { readNumber } from "@/lib/validation/boat-cost";

const defaults = {
  price: "",
  downPercent: "20",
  annualRate: "7",
  years: "10",
  operating: "",
};
const inputs = [
  ["price", "Purchase price", "$"],
  ["downPercent", "Down payment", "%"],
  ["annualRate", "Nominal interest rate", "%"],
  ["years", "Loan term", "years"],
  ["operating", "Monthly operating expenses", "$"],
] as const;

export function ScenarioFields({ title }: { title: string }) {
  const id = useId();
  const [state, setState] = useState(defaults);
  let result: ReturnType<typeof projectFiveYears> | undefined;
  let message = "Enter a purchase price and monthly operating expenses.";
  if (state.price.trim() && state.operating.trim()) {
    try {
      result = projectFiveYears({
        price: readNumber(state.price),
        downPercent: readNumber(state.downPercent),
        annualRate: readNumber(state.annualRate),
        years: readNumber(state.years),
        operating: readNumber(state.operating),
      });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      message =
        "Check your entries. Rates must be 0–35%, down payment 0–100%, and terms 1–50 whole years.";
    }
  }
  return (
    <fieldset className="research-scenario">
      <legend>{title}</legend>
      <p>
        Use your own purchase price and expenses. The example loan terms are
        editable.
      </p>
      <div className="research-scenario-inputs">
        {inputs.map(([key, label, unit]) => (
          <NumericField
            key={key}
            id={id + key}
            label={label}
            unit={unit}
            value={state[key]}
            onChange={(value) =>
              setState((current) => ({ ...current, [key]: value }))
            }
          />
        ))}
      </div>
      <div role="status" className="research-scenario-result">
        {result ? (
          <dl className="research-specs">
            <div>
              <dt>Monthly loan payment</dt>
              <dd>{money(result.monthlyPayment)}</dd>
            </div>
            <div>
              <dt>Monthly ownership cash outflow</dt>
              <dd>{money(result.monthlyCashFlow)}</dd>
            </div>
            <div>
              <dt>Five-year cash outflow</dt>
              <dd>{money(result.periodCashOutflow)}</dd>
            </div>
            <div>
              <dt>Loan balance after five years</dt>
              <dd>{money(result.remainingBalance)}</dd>
            </div>
          </dl>
        ) : (
          <p>{message}</p>
        )}
      </div>
      <p>
        Five-year cash outflow includes the down payment, loan payments due in
        that period and operating costs. Taxes, fees and resale are excluded.
      </p>
      <button
        type="button"
        className="reset-button"
        onClick={() => setState(defaults)}
      >
        Reset assumptions
      </button>
    </fieldset>
  );
}
