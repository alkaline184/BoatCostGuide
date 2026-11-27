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

  if (!Number.isFinite(price) || price < 0 || price > 1e12) {
    errors.price = "Enter a purchase price from $0 to $1 trillion.";
  }
  if (!Number.isFinite(downPayment) || downPayment < 0) {
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
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 1000) {
    errors.annualRate = "Enter an annual interest rate from 0% to 1,000%.";
  }
  if (!Number.isInteger(years) || years < 1 || years > 100) {
    errors.years = "Enter a whole number from 1 to 100 years.";
  }
  if (!Number.isFinite(operating) || operating < 0 || operating > 1e12) {
    errors.operating =
      "Enter monthly operating expenses from $0 to $1 trillion.";
  }
  return errors;
}

export function readNumber(raw: string): number {
  const value = raw.trim();
  return /^\d+(\.\d*)?$|^\.\d+$/.test(value) ? Number(value) : NaN;
}
