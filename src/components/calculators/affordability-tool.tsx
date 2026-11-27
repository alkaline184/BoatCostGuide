"use client";

import { affordability } from "@/lib/finance/calculators";
import { money } from "@/lib/formatting/money";
import type { DownPaymentMode } from "@/lib/validation/boat-cost";
import {
  CalculatorPanel,
  ImportScenario,
  Readout,
  downFields,
  evaluate,
  termFields,
  terms,
  useScenario,
} from "./tool-ui";

const defaults = {
  budget: "800",
  operating: "350",
  down: "20",
  downMode: "percent",
  annualRate: "7",
  term: "10",
  termUnit: "years",
  fees: "0",
  taxRate: "0",
  cashLimit: "",
};
const messages = {
  "over-budget":
    "Operating expenses exceed your monthly budget. Reduce expenses or increase the budget before estimating a purchase price.",
  "insufficient-cash":
    "The upfront cash limit cannot cover the chosen down payment, taxes and fees at any feasible purchase price.",
  unbounded:
    "A 100% down payment removes the financing constraint. Enter a maximum upfront cash budget to estimate a purchase price.",
};

export function AffordabilityTool() {
  const s = useScenario(defaults);
  const { result, error } = evaluate(() =>
    affordability({
      ...terms(s),
      budget: s.n("budget"),
      operating: s.n("operating"),
      down: s.n("down"),
      downMode: s.fields.downMode as DownPaymentMode,
      fees: s.n("fees"),
      taxRate: s.n("taxRate"),
      cashLimit: s.fields.cashLimit.trim() ? s.n("cashLimit") : undefined,
    }),
  );
  const estimate = result?.status === "estimate" ? result : undefined;
  return (
    <>
      <CalculatorPanel
        title="Estimated maximum purchase price"
        summary={estimate ? money(estimate.price) : "—"}
        error={
          error ??
          (result && result.status !== "estimate"
            ? messages[result.status]
            : undefined)
        }
        reset={s.reset}
        inputs={
          <>
            {s.field("budget", "Monthly total boating budget")}
            {s.field("operating", "Monthly operating expenses")}
            {downFields(s)}
            {termFields(s)}
            {s.field(
              "taxRate",
              "Sales tax rate",
              "%",
              "Applied to the full purchase price and paid upfront.",
            )}
            {s.field("fees", "Upfront acquisition fees")}
            <label className="tool-select">
              Maximum upfront cash budget (optional)
              <input
                type="text"
                inputMode="decimal"
                value={s.fields.cashLimit}
                onChange={(event) => s.set("cashLimit", event.target.value)}
                placeholder="No cash limit entered"
              />
            </label>
          </>
        }
      >
        {result && (
          <>
            {result.available === 0 && (
              <p className="result-note">
                Your operating expenses leave no room for a monthly loan
                payment.
              </p>
            )}
            <Readout
              items={[
                ["Monthly amount available for financing", result.available],
                ["Maximum estimated financed principal", result.maxPrincipal],
                ...(estimate
                  ? ([
                      ["Required down payment", estimate.down],
                      ["Estimated upfront cash", estimate.upfront],
                      ["Estimated monthly loan payment", estimate.loan.monthly],
                      ["Monthly operating expenses", s.n("operating")],
                      ["Combined monthly cash outflow", estimate.monthlyTotal],
                      ["Annualized cash outflow", estimate.annualTotal],
                    ] as Array<[string, number]>)
                  : []),
              ]}
            />
          </>
        )}
        <p className="result-note">
          This is a planning estimate based on your budget. Taxes and fees are
          paid upfront. Annualized cash flow represents 12 months at the monthly
          run rate during repayment.
        </p>
      </CalculatorPanel>
      <ImportScenario
        path="/boat-affordability-calculator"
        scenario={s}
        keys={["operating", "annualRate", "term", "termUnit"]}
      />
    </>
  );
}
