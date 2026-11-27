import { calculateBoatCost } from "../finance/boat-cost";
import { remainingBalance } from "../finance/loan";

export function projectFiveYears(input: {
  price: number;
  downPercent: number;
  annualRate: number;
  years: number;
  operating: number;
}) {
  const loan = calculateBoatCost({
    price: input.price,
    downPayment: input.downPercent,
    downPaymentMode: "percent",
    annualRate: input.annualRate,
    years: input.years,
    operating: input.operating,
  });
  const horizon = 60;
  return {
    monthlyPayment: loan.monthlyLoan,
    monthlyCashFlow: loan.monthlyTotal,
    periodCashOutflow:
      input.price * (input.downPercent / 100) +
      loan.monthlyLoan * Math.min(horizon, input.years * 12) +
      input.operating * horizon,
    remainingBalance: remainingBalance(
      loan.principal,
      input.annualRate,
      input.years * 12,
      horizon,
    ),
  };
}
