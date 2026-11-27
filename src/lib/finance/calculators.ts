import {
  amortize,
  fixedLoan,
  limits,
  paymentFactor,
  remainingBalance,
  requireChoice,
  requireRange,
} from "./loan";
import { downPaymentAmount } from "./boat-cost";
import type { DownPaymentMode } from "../validation/boat-cost";

export type LoanTerms = { annualRate: number; months: number };
type DownPayment = { down: number; downMode: DownPaymentMode };

function validateDown({ down, downMode }: DownPayment) {
  requireChoice(downMode, ["amount", "percent"], "down payment unit");
  requireRange(
    down,
    downMode === "percent" ? 100 : limits.price,
    "Down payment",
  );
}

export function purchaseLoan(
  input: LoanTerms &
    DownPayment & {
      price: number;
      tradeValue: number;
      tradeBalance: number;
      taxable: number;
      taxRate: number;
      dealerFees: number;
      otherFees: number;
      feeMode: "finance" | "upfront";
    },
) {
  validateDown(input);
  requireRange(input.price, limits.price, "Purchase price");
  requireRange(input.tradeValue, limits.price, "Trade-in value");
  requireRange(input.tradeBalance, limits.price, "Trade-in loan balance");
  requireRange(input.taxable, input.price, "Taxable purchase amount");
  requireRange(input.taxRate, 20, "Sales tax rate");
  requireRange(input.dealerFees, limits.expense, "Dealer fees");
  requireRange(input.otherFees, limits.expense, "Other acquisition fees");
  requireChoice(
    input.feeMode,
    ["finance", "upfront"],
    "tax and fee payment method",
  );
  const down = downPaymentAmount(input.price, input.down, input.downMode);
  const equity = input.tradeValue - input.tradeBalance;
  const charges =
    input.taxable * (input.taxRate / 100) + input.dealerFees + input.otherFees;
  const financedCharges = input.feeMode === "finance" ? charges : 0;
  const financeable = input.price - equity + financedCharges;
  if (down > Math.max(0, Math.min(input.price, financeable))) {
    throw new RangeError(
      "Reduce the down payment. It cannot exceed the purchase price or the remaining financeable cost after trade-in.",
    );
  }
  const principal = Math.max(0, financeable - down);
  const upfront = Math.max(
    0,
    down + charges - financedCharges + Math.min(0, financeable),
  );
  const surplus = Math.max(0, -financeable - (charges - financedCharges));
  const loan = fixedLoan(principal, input.annualRate, input.months);
  return {
    loan,
    upfront,
    surplus,
    equity,
    charges,
    down,
    acquisitionCash: upfront + loan.total - surplus,
  };
}

export function affordability(
  input: LoanTerms &
    DownPayment & {
      budget: number;
      operating: number;
      fees: number;
      taxRate: number;
      cashLimit?: number;
    },
) {
  validateDown(input);
  requireRange(input.budget, limits.expense, "Monthly budget");
  requireRange(input.operating, limits.expense, "Monthly operating expenses");
  requireRange(input.fees, limits.expense, "Acquisition fees");
  requireRange(input.taxRate, 20, "Sales tax rate");
  if (input.cashLimit !== undefined)
    requireRange(input.cashLimit, limits.price, "Upfront cash limit");

  const available = Math.max(0, input.budget - input.operating);
  const maxPrincipal =
    available / paymentFactor(input.annualRate, input.months);
  const tax = input.taxRate / 100;
  const fixed = input.downMode === "amount" ? input.down : 0;
  const fraction = input.downMode === "percent" ? input.down / 100 : 0;
  if (input.operating > input.budget)
    return { status: "over-budget", available, maxPrincipal } as const;
  if (input.cashLimit !== undefined && input.cashLimit < fixed + input.fees) {
    return { status: "insufficient-cash", available, maxPrincipal } as const;
  }
  const financeBound =
    fraction === 1 ? Infinity : (maxPrincipal + fixed) / (1 - fraction);
  const cashBound =
    input.cashLimit === undefined || fraction + tax === 0
      ? Infinity
      : (input.cashLimit - fixed - input.fees) / (fraction + tax);
  const price = Math.min(financeBound, cashBound);
  if (!Number.isFinite(price))
    return { status: "unbounded", available, maxPrincipal } as const;
  if (price < fixed)
    return { status: "insufficient-cash", available, maxPrincipal } as const;
  const down = fixed + price * fraction;
  const upfront = down + price * tax + input.fees;
  const loan = fixedLoan(
    price * (1 - fraction) - fixed,
    input.annualRate,
    input.months,
  );
  const monthlyTotal = loan.monthly + input.operating;
  return {
    status: "estimate",
    available,
    maxPrincipal,
    price,
    down,
    upfront,
    loan,
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
  } as const;
}

export const expenseCategories = {
  fuel: "Fuel",
  insurance: "Insurance",
  maintenance: "Maintenance",
  repairs: "Repairs and replacement reserve",
  marina: "Marina or dock fees",
  storage: "Dry storage",
  winter: "Winterization",
  registration: "Registration",
  taxes: "Recurring taxes",
  trailer: "Trailer maintenance",
  equipment: "Equipment and supplies",
  other: "Other expenses",
} as const;
export type Expense = keyof typeof expenseCategories;
export type ExpenseEntry = { value: number; unit: "monthly" | "annual" };
export type Fuel =
  | { mode: "direct" }
  | {
      mode: "usage";
      hours: number;
      gallonsPerHour: number;
      pricePerGallon: number;
    };

export function ownership(
  input: LoanTerms & {
    price: number;
    purchase: "cash" | "financed";
    down: number;
    charges: number;
    expenses: Record<Expense, ExpenseEntry>;
    fuel: Fuel;
    storage: "marina" | "storage" | "none";
    years: number;
    resale?: number;
  },
) {
  requireChoice(input.purchase, ["cash", "financed"], "purchase method");
  requireChoice(
    input.storage,
    ["marina", "storage", "none"],
    "storage arrangement",
  );
  requireChoice(input.fuel.mode, ["direct", "usage"], "fuel estimation method");
  requireRange(input.price, limits.price, "Purchase price");
  requireRange(input.charges, limits.expense, "Acquisition taxes and fees");
  if (!Number.isInteger(input.years) || input.years < 1 || input.years > 50)
    throw new RangeError("Enter an ownership period of 1 to 50 whole years.");
  if (input.resale !== undefined)
    requireRange(input.resale, limits.price, "Future resale value");
  const down = input.purchase === "cash" ? input.price : input.down;
  requireRange(down, input.price, "Down payment");
  const loan = fixedLoan(input.price - down, input.annualRate, input.months);
  let estimatedFuel = 0;
  if (input.fuel.mode === "usage") {
    const { hours, gallonsPerHour, pricePerGallon } = input.fuel;
    requireRange(hours, 8760, "Annual engine hours");
    requireRange(gallonsPerHour, 1000, "Gallons per hour");
    requireRange(pricePerGallon, 50, "Fuel price per gallon");
    estimatedFuel = hours * gallonsPerHour * pricePerGallon;
  }
  const categories = (Object.keys(expenseCategories) as Expense[]).map(
    (key) => {
      if (key === "fuel" && input.fuel.mode === "usage")
        return { key, annual: estimatedFuel };
      if ((key === "marina" || key === "storage") && key !== input.storage)
        return { key, annual: 0 };
      const { value, unit } = input.expenses[key];
      requireChoice(unit, ["monthly", "annual"], "expense frequency");
      requireRange(value, limits.expense, expenseCategories[key]);
      return { key, annual: unit === "monthly" ? value * 12 : value };
    },
  );
  const annualOperating = categories.reduce(
    (total, category) => total + category.annual,
    0,
  );
  const elapsed = input.years * 12;
  const balance = remainingBalance(
    loan.principal,
    input.annualRate,
    input.months,
    elapsed,
  );
  const initialCash = down + input.charges;
  const periodLoan =
    elapsed >= loan.months ? loan.total : loan.monthly * elapsed;
  const periodOperating = annualOperating * input.years;
  const periodCash = initialCash + periodLoan + periodOperating;
  return {
    loan,
    categories,
    annualOperating,
    monthlyOperating: annualOperating / 12,
    monthlyTotal: loan.monthly + annualOperating / 12,
    annualTotal: Math.min(12, loan.months) * loan.monthly + annualOperating,
    balance,
    initialCash,
    periodLoan,
    periodOperating,
    periodCash,
    equity: input.resale === undefined ? undefined : input.resale - balance,
    economicCost:
      input.resale === undefined
        ? undefined
        : periodCash + balance - input.resale,
  };
}

export function payoff(input: {
  balance: number;
  annualRate: number;
  remaining:
    { mode: "term"; months: number } | { mode: "payment"; payment: number };
  extra: number;
  lump: number;
}) {
  requireRange(input.balance, limits.price, "Current balance");
  requireRange(input.extra, limits.expense, "Additional monthly principal");
  requireRange(input.lump, limits.price, "One-time principal payment");
  requireRange(input.annualRate, limits.rate, "Annual interest rate");
  requireChoice(
    input.remaining.mode,
    ["term", "payment"],
    "remaining loan method",
  );
  if (input.remaining.mode === "payment")
    requireRange(input.remaining.payment, limits.expense, "Scheduled payment");
  const regular =
    input.remaining.mode === "term"
      ? fixedLoan(input.balance, input.annualRate, input.remaining.months)
          .monthly
      : input.remaining.payment;
  const original = amortize(
    input.balance,
    input.annualRate,
    regular,
    input.remaining.mode === "term" ? input.remaining.months : undefined,
  );
  const appliedLump = Math.min(input.balance, input.lump);
  const newPayment = input.balance > appliedLump ? regular + input.extra : 0;
  const accelerated =
    input.extra === 0 && appliedLump === 0
      ? original
      : amortize(
          input.balance - appliedLump,
          input.annualRate,
          newPayment,
          input.remaining.mode === "term" ? input.remaining.months : undefined,
        );
  const originalInterest = original.at(-1)?.cumulativeInterest ?? 0;
  const acceleratedInterest = accelerated.at(-1)?.cumulativeInterest ?? 0;
  return {
    original,
    accelerated,
    originalInterest,
    acceleratedInterest,
    appliedLump,
    newPayment,
    monthsSaved: original.length - accelerated.length,
    interestSaved: Math.max(0, originalInterest - acceleratedInterest),
  };
}
