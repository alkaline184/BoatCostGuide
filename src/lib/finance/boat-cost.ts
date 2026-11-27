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
  const payments = input.years * 12;
  const monthlyRate = input.annualRate / 1200;
  // Avoid cancellation for rates close to zero.
  const monthlyLoan =
    monthlyRate === 0
      ? principal / payments
      : principal *
        (monthlyRate / -Math.expm1(-payments * Math.log1p(monthlyRate)));
  const scheduledPayments =
    monthlyRate === 0 ? principal : monthlyLoan * payments;
  const monthlyTotal = monthlyLoan + input.operating;

  return {
    principal,
    monthlyLoan,
    monthlyOperating: input.operating,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    totalInterest: Math.max(0, scheduledPayments - principal),
    scheduledPayments,
  };
}
