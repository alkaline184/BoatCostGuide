"use client";

import { purchaseLoan } from "@/lib/finance/calculators";
import { amortize, fixedLoan, requireChoice } from "@/lib/finance/loan";
import { money } from "@/lib/formatting/money";
import type { DownPaymentMode } from "@/lib/validation/boat-cost";
import {
  BalanceChart,
  Breakdown,
  CalculatorPanel,
  Readout,
  Schedule,
  TransferButton,
  downFields,
  evaluate,
  termFields,
  terms,
  useScenario,
} from "./tool-ui";

const defaults = {
  price: "45000",
  down: "20",
  downMode: "percent",
  annualRate: "7",
  term: "10",
  termUnit: "years",
  tradeValue: "0",
  tradeBalance: "0",
  taxable: "45000",
  taxBasis: "price",
  taxRate: "0",
  dealerFees: "0",
  otherFees: "0",
  feeMode: "upfront",
};

export function LoanTool() {
  const s = useScenario(defaults);
  const months = s.n("term") * (s.fields.termUnit === "years" ? 12 : 1);
  const annualRate = s.n("annualRate");
  const { result, error } = evaluate(() => {
    requireChoice(s.fields.taxBasis, ["price", "custom"], "sales tax basis");
    return purchaseLoan({
      ...terms(s),
      price: s.n("price"),
      down: s.n("down"),
      downMode: s.fields.downMode as DownPaymentMode,
      tradeValue: s.n("tradeValue"),
      tradeBalance: s.n("tradeBalance"),
      taxable: s.fields.taxBasis === "price" ? s.n("price") : s.n("taxable"),
      taxRate: s.n("taxRate"),
      dealerFees: s.n("dealerFees"),
      otherFees: s.n("otherFees"),
      feeMode: s.fields.feeMode as "upfront" | "finance",
    });
  });
  const loan = result?.loan;
  const rows = loan
    ? amortize(loan.principal, annualRate, loan.monthly, months)
    : [];
  return (
    <>
      <CalculatorPanel
        title="Estimated monthly payment"
        summary={loan ? money(loan.monthly) : "—"}
        error={error}
        reset={s.reset}
        inputs={
          <>
            {s.field(
              "price",
              "Boat purchase price",
              "$",
              undefined,
              25_000_000,
            )}
            {downFields(s)}
            {termFields(s)}
            <details className="tool-details">
              <summary>Trade-in, sales tax and fees</summary>
              <div className="fields tool-details-body">
                {s.field("tradeValue", "Trade-in value")}
                {s.field("tradeBalance", "Outstanding trade-in loan balance")}
                {s.field("taxRate", "Sales tax rate", "%")}
                {s.choice("taxBasis", "Sales tax basis", [
                  ["price", "Full purchase price"],
                  ["custom", "Custom taxable amount"],
                ])}
                {s.fields.taxBasis === "custom" &&
                  s.field(
                    "taxable",
                    "Taxable purchase amount",
                    "$",
                    "Use the amount eligible for taxation in your transaction.",
                  )}
                {s.field("dealerFees", "Dealer and documentation fees")}
                {s.field("otherFees", "Other acquisition fees")}
                {s.choice("feeMode", "Taxes and fees", [
                  ["upfront", "Pay upfront"],
                  ["finance", "Include in loan"],
                ])}
              </div>
            </details>
          </>
        }
      >
        {result && loan && (
          <>
            <Readout
              items={[
                ["Amount financed", loan.principal],
                ["Upfront cash required", result.upfront],
                [
                  result.equity < 0
                    ? "Negative trade-in equity"
                    : "Positive trade-in equity",
                  result.equity,
                ],
                ["Taxes and fees", result.charges],
                ["Total scheduled loan payments", loan.total],
                ["Total loan interest", loan.interest],
                ["Loan payoff duration", `${loan.months} months`],
                ["Acquisition cash outflow", result.acquisitionCash],
                ...(result.surplus
                  ? [["Trade-in surplus", result.surplus] as [string, number]]
                  : []),
              ]}
            />
            <Breakdown
              items={[
                ["Principal repaid", loan.principal],
                ["Scheduled interest", loan.interest],
              ]}
            />
          </>
        )}
        <p className="result-note">
          Acquisition cash outflow includes upfront cash and loan payments, less
          any trade-in surplus. It excludes ongoing expenses and the noncash
          value surrendered in a trade-in.
        </p>
      </CalculatorPanel>
      {result && loan && (
        <div className="tool-extras">
          <section aria-labelledby="term-comparison">
            <h2 id="term-comparison">Compare loan terms</h2>
            <p>
              All rows use the same financed amount and nominal rate. A lender
              may quote different rates for different terms.
            </p>
            <div
              className="tool-table"
              role="region"
              aria-label="Loan term comparison"
              tabIndex={0}
            >
              <table>
                <caption>Estimated payments by term</caption>
                <thead>
                  <tr>
                    <th scope="col">Term</th>
                    <th scope="col">Payment per month</th>
                    <th scope="col">Total interest</th>
                    <th scope="col">Scheduled payments</th>
                  </tr>
                </thead>
                <tbody>
                  {[5, 10, 15, 20].map((years) => {
                    const comparison = fixedLoan(
                      loan.principal,
                      annualRate,
                      years * 12,
                    );
                    return (
                      <tr key={years}>
                        <th scope="row">{years} years</th>
                        <td>{money(comparison.monthly)}</td>
                        <td>{money(comparison.interest)}</td>
                        <td>{money(comparison.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section aria-labelledby="loan-schedule">
            <h2 id="loan-schedule">Amortization and loan balance</h2>
            <BalanceChart
              series={[
                { label: "Scheduled loan", principal: loan.principal, rows },
              ]}
            />
            <Schedule rows={rows} name="Loan amortization schedule" />
          </section>
          <div className="schedule-actions">
            <TransferButton
              destination="/boat-ownership-cost-calculator"
              values={{
                price: s.fields.price,
                down: String(result.down),
                annualRate: s.fields.annualRate,
                term: String(months),
                charges: String(result.charges),
              }}
            >
              Send purchase assumptions to ownership calculator
            </TransferButton>
            <TransferButton
              destination="/boat-loan-payoff-calculator"
              values={{
                balance: String(loan.principal),
                annualRate: s.fields.annualRate,
                remaining: String(Math.max(1, loan.months)),
              }}
            >
              Send starting loan to payoff calculator
            </TransferButton>
          </div>
        </div>
      )}
    </>
  );
}
