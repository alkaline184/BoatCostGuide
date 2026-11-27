export const calculators = {
  "/boat-loan-calculator": {
    name: "Boat Loan Calculator",
    title: "Boat Loan Calculator — Monthly Payments & Amortization",
    description:
      "Estimate boat loan payments with taxes, fees and trade-in equity. Compare repayment terms and download a complete amortization schedule.",
    action: "Estimate payments and compare terms.",
  },
  "/boat-affordability-calculator": {
    name: "Boat Affordability Calculator",
    title: "Boat Affordability Calculator — How Much Boat Can I Afford?",
    description:
      "Estimate a boat purchase price based on your monthly boating budget, operating expenses, down payment and upfront cash limit.",
    action: "Work backward from your monthly budget.",
  },
  "/boat-ownership-cost-calculator": {
    name: "Boat Ownership Cost Calculator",
    title: "Boat Ownership Cost Calculator — Estimate Cash Flow & Resale",
    description:
      "Budget for fuel, storage, insurance and upkeep. Compare monthly cash flow, loan balances and net ownership cost after an estimated resale.",
    action: "Budget for fuel, storage, maintenance and resale.",
  },
  "/boat-loan-payoff-calculator": {
    name: "Boat Loan Payoff Calculator",
    title: "Boat Loan Payoff Calculator — Estimate Interest Savings",
    description:
      "See how additional monthly or one-time principal payments could change your boat loan payoff date and remaining interest.",
    action: "Compare payoff times and potential interest savings.",
  },
} as const;

export type CalculatorPath = keyof typeof calculators;
export const calculatorPaths = Object.keys(calculators) as CalculatorPath[];
