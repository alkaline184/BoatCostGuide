export const limits = {
  price: 25_000_000,
  expense: 1_000_000,
  rate: 35,
  months: 600,
} as const;

export function inRange(value: number, max: number) {
  return Number.isFinite(value) && value >= 0 && value <= max;
}

export function requireRange(value: number, max: number, label: string) {
  if (!inRange(value, max))
    throw new RangeError(
      `${label} must be between 0 and ${max.toLocaleString("en-US")}.`,
    );
}

export function requireChoice<T extends string>(
  value: T,
  choices: readonly T[],
  label: string,
) {
  if (!choices.includes(value))
    throw new RangeError(`Select a valid ${label}.`);
}

export function requireTerm(months: number) {
  if (!Number.isInteger(months) || months < 1 || months > limits.months) {
    throw new RangeError("Enter a loan term between 1 and 600 whole months.");
  }
}

export function paymentFactor(annualRate: number, months: number) {
  requireRange(annualRate, limits.rate, "Annual interest rate");
  requireTerm(months);
  const rate = annualRate / 1200;
  return rate === 0
    ? 1 / months
    : rate / -Math.expm1(-months * Math.log1p(rate));
}

export function fixedLoan(
  principal: number,
  annualRate: number,
  months: number,
) {
  if (!Number.isFinite(principal) || principal < 0)
    throw new RangeError("Financed principal must be nonnegative.");
  const factor = paymentFactor(annualRate, months);
  const monthly = annualRate === 0 ? principal / months : principal * factor;
  const total = annualRate === 0 ? principal : monthly * months;
  return {
    principal,
    monthly,
    total,
    interest: Math.max(0, total - principal),
    months: principal === 0 ? 0 : months,
  };
}

export type PaymentRow = {
  number: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
};

export function amortize(
  principal: number,
  annualRate: number,
  monthly: number,
  scheduledMonths?: number,
): PaymentRow[] {
  requireRange(annualRate, limits.rate, "Annual interest rate");
  if (
    !Number.isFinite(principal) ||
    principal < 0 ||
    !Number.isFinite(monthly) ||
    monthly < 0
  ) {
    throw new RangeError("Enter a valid balance and payment.");
  }
  if (scheduledMonths !== undefined) requireTerm(scheduledMonths);
  if (principal === 0) return [];

  const rate = annualRate / 1200;
  if (monthly <= principal * rate)
    throw new RangeError(
      "The scheduled monthly payment must exceed the first month's interest.",
    );
  const fixed =
    scheduledMonths !== undefined &&
    monthly === fixedLoan(principal, annualRate, scheduledMonths).monthly;
  const rows: PaymentRow[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  const tolerance = principal * Number.EPSILON * 64;

  for (let number = 1; number <= (scheduledMonths ?? limits.months); number++) {
    const interest = balance * rate;
    const reduction = monthly - interest;
    const nextBalance = fixed
      ? number === scheduledMonths
        ? 0
        : monthly / paymentFactor(annualRate, scheduledMonths! - number)
      : number === scheduledMonths || reduction >= balance - tolerance
        ? 0
        : balance - reduction;
    const paid = balance - nextBalance;
    balance = nextBalance;
    cumulativeInterest += interest;
    rows.push({
      number,
      payment: paid + interest,
      principal: paid,
      interest,
      balance,
      cumulativeInterest,
    });
    if (balance === 0) return rows;
  }
  throw new RangeError(
    "The scheduled payment must repay the loan within 600 months.",
  );
}

export function remainingBalance(
  principal: number,
  annualRate: number,
  months: number,
  elapsed: number,
) {
  const loan = fixedLoan(principal, annualRate, months);
  if (!Number.isInteger(elapsed) || elapsed < 0)
    throw new RangeError("Elapsed months must be a nonnegative whole number.");
  if (elapsed >= months) return 0;
  if (elapsed === 0) return principal;
  return loan.monthly / paymentFactor(annualRate, months - elapsed);
}
