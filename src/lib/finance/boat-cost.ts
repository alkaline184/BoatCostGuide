import { fixedLoan, requireChoice } from "./loan";
import {
  validateBoatCost,
  type BoatCostInput,
  type DownPaymentMode,
} from "../validation/boat-cost";

export const illustrativeInputs = {
  price: 45000,
  downPayment: 20,
  downPaymentMode: "percent",
  annualRate: 7,
  years: 10,
  operating: 350,
} as const satisfies BoatCostInput;

export function downPaymentAmount(
  price: number,
  payment: number,
  mode: DownPaymentMode,
): number {
  requireChoice(mode, ["amount", "percent"], "down payment unit");
  return mode === "percent" ? price * (payment / 100) : payment;
}

export function downPaymentPercent(price: number, amount: number): number {
  return price === 0 ? 0 : (amount / price) * 100;
}

export function calculateBoatCost(input: BoatCostInput) {
  if (Object.keys(validateBoatCost(input)).length) {
    throw new RangeError("Invalid boat cost inputs.");
  }

  const principal =
    input.price -
    downPaymentAmount(input.price, input.downPayment, input.downPaymentMode);
  const loan = fixedLoan(principal, input.annualRate, input.years * 12);
  const monthlyLoan = loan.monthly;
  const monthlyTotal = monthlyLoan + input.operating;

  return {
    principal,
    monthlyLoan,
    monthlyOperating: input.operating,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    totalInterest: loan.interest,
    scheduledPayments: loan.total,
  };
}
