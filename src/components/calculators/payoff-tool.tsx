"use client";

import { payoff } from "@/lib/finance/calculators";
import { requireChoice } from "@/lib/finance/loan";
import { money } from "@/lib/formatting/money";
import {
  BalanceChart,
  CalculatorPanel,
  ImportScenario,
  Readout,
  Schedule,
  evaluate,
  useScenario,
} from "./tool-ui";

const defaults = {
  balance: "36000",
  annualRate: "7",
  mode: "term",
  remaining: "120",
  scheduled: "417.99",
  extra: "100",
  lump: "0",
};

export function PayoffTool() {
  const s = useScenario(defaults);
  const { result, error } = evaluate(() => {
    requireChoice(s.fields.mode, ["term", "payment"], "remaining loan method");
    return payoff({
      balance: s.n("balance"),
      annualRate: s.n("annualRate"),
      remaining:
        s.fields.mode === "term"
          ? { mode: "term", months: s.n("remaining") }
          : { mode: "payment", payment: s.n("scheduled") },
      extra: s.n("extra"),
      lump: s.n("lump"),
    });
  });
  return (
    <>
      <CalculatorPanel
        title="Estimated interest savings"
        summary={result ? money(result.interestSaved) : "—"}
        error={error}
        reset={s.reset}
        inputs={
          <>
            {s.field("balance", "Current loan balance")}
            {s.field(
              "annualRate",
              "Annual interest rate",
              "%",
              "Use the nominal annual interest rate.",
            )}
            {s.choice("mode", "How to describe your loan", [
              ["term", "Remaining term"],
              ["payment", "Scheduled monthly payment"],
            ])}
            {s.fields.mode === "term"
              ? s.field("remaining", "Remaining loan term", "months")
              : s.field(
                  "scheduled",
                  "Scheduled monthly principal and interest",
                )}
            {s.field("extra", "Additional monthly principal")}
            {s.field(
              "lump",
              "One-time principal payment",
              "$",
              "Applied today before future interest accrues.",
            )}
          </>
        }
      >
        {result && (
          <>
            <Readout
              items={[
                [
                  "Original payoff duration",
                  `${result.original.length} months`,
                ],
                [
                  "Accelerated payoff duration",
                  `${result.accelerated.length} months`,
                ],
                ["Time saved", `${result.monthsSaved} months`],
                ["Original remaining interest", result.originalInterest],
                ["Accelerated remaining interest", result.acceleratedInterest],
                ["New scheduled monthly payment", result.newPayment],
                ["One-time principal applied", result.appliedLump],
              ]}
            />
            {s.n("lump") > result.appliedLump && (
              <p className="result-note">
                Only the outstanding balance can be applied. The excess one-time
                payment is excluded.
              </p>
            )}
          </>
        )}
        <p className="result-note">
          Extra payments go directly to principal. This estimate excludes
          prepayment penalties, fees and daily interest. The final payment may
          be smaller.
        </p>
      </CalculatorPanel>
      <ImportScenario
        path="/boat-loan-payoff-calculator"
        scenario={s}
        keys={["balance", "annualRate", "remaining"]}
      />
      {result && (
        <section className="tool-extras">
          <h2>Compare repayment schedules</h2>
          <BalanceChart
            series={[
              {
                label: "Original",
                principal: s.n("balance"),
                rows: result.original,
              },
              {
                label: "Accelerated",
                principal: s.n("balance") - result.appliedLump,
                rows: result.accelerated,
              },
            ]}
          />
          <Schedule
            rows={result.original}
            name="Original amortization schedule"
          />
          <Schedule
            rows={result.accelerated}
            name="Accelerated amortization schedule"
          />
        </section>
      )}
    </>
  );
}
