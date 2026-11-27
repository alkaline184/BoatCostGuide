import { inRange, limits } from "../finance/loan";

export type DownPaymentMode = "amount" | "percent";

export type BoatCostInput = {
  price: number;
  downPayment: number;
  downPaymentMode: DownPaymentMode;
  annualRate: number;
  years: number;
  operating: number;
};

type Field = Exclude<keyof BoatCostInput, "downPaymentMode">;
export type InputErrors = Partial<Record<Field, string>>;

export function validateBoatCost(input: BoatCostInput): InputErrors {
  const errors: InputErrors = {};
  const { price, downPayment, downPaymentMode, annualRate, years, operating } =
    input;

  if (!inRange(price, limits.price)) {
    errors.price = "Enter a purchase price from $0 to $25 million.";
  }
  if (downPaymentMode !== "amount" && downPaymentMode !== "percent") {
    errors.downPayment = "Select dollars or percentage for the down payment.";
  } else if (!Number.isFinite(downPayment) || downPayment < 0) {
    errors.downPayment = "Enter a down payment of zero or more.";
  } else if (downPaymentMode === "percent" && downPayment > 100) {
    errors.downPayment = "Enter a percentage from 0 to 100.";
  } else if (
    downPaymentMode === "amount" &&
    !errors.price &&
    downPayment > price
  ) {
    errors.downPayment = "The down payment cannot exceed the purchase price.";
  }
  if (!inRange(annualRate, limits.rate)) {
    errors.annualRate = "Enter an annual interest rate from 0% to 35%.";
  }
  if (!Number.isInteger(years) || years < 1 || years > 50) {
    errors.years = "Enter a whole number from 1 to 50 years.";
  }
  if (!inRange(operating, limits.expense)) {
    errors.operating =
      "Enter monthly operating expenses from $0 to $1 million.";
  }
  return errors;
}

export function readNumber(raw: string): number {
  const value = raw.trim();
  return /^\d+(\.\d*)?$|^\.\d+$/.test(value) ? Number(value) : NaN;
}
