import { describe, expect, it } from "vitest";
import {
  affordability,
  expenseCategories,
  ownership,
  payoff,
  purchaseLoan,
  type Expense,
  type ExpenseEntry,
} from "../../src/lib/finance/calculators";
import {
  amortize,
  fixedLoan,
  remainingBalance,
} from "../../src/lib/finance/loan";
import {
  calculateBoatCost,
  illustrativeInputs,
} from "../../src/lib/finance/boat-cost";

const loanInput = {
  price: 45000,
  down: 20,
  downMode: "percent" as const,
  annualRate: 7,
  months: 120,
  tradeValue: 0,
  tradeBalance: 0,
  taxable: 45000,
  taxRate: 0,
  dealerFees: 0,
  otherFees: 0,
  feeMode: "upfront" as const,
};
const budgetInput = {
  down: 20,
  downMode: "percent" as const,
  annualRate: 7,
  months: 120,
  operating: 350,
  budget: 767.9905251870466,
  fees: 0,
  taxRate: 0,
};
const expenses = Object.fromEntries(
  Object.keys(expenseCategories).map((key) => [
    key,
    { value: 0, unit: "annual" },
  ]),
) as Record<Expense, ExpenseEntry>;
const ownershipInput = {
  price: 45000,
  purchase: "financed" as const,
  down: 9000,
  annualRate: 7,
  months: 120,
  charges: 0,
  expenses,
  fuel: { mode: "direct" } as const,
  storage: "none" as const,
  years: 5,
};

describe("shared fixed-rate engine", () => {
  it("agrees across purchase, affordability, ownership, payoff and homepage", () => {
    const { loan } = purchaseLoan(loanInput);
    expect(loan.monthly).toBeCloseTo(417.9905251870466, 9);
    expect(calculateBoatCost(illustrativeInputs).monthlyLoan).toBe(
      loan.monthly,
    );
    const estimate = affordability(budgetInput);
    expect(estimate.status).toBe("estimate");
    if (estimate.status !== "estimate") return;
    expect(estimate.price).toBeCloseTo(45000, 8);
    expect(estimate.loan.monthly).toBeCloseTo(loan.monthly, 9);
    const owned = ownership(ownershipInput);
    expect(owned.loan.monthly).toBe(loan.monthly);
    const scheduled = payoff({
      balance: 36000,
      annualRate: 7,
      remaining: { mode: "term", months: 120 },
      extra: 0,
      lump: 0,
    });
    expect(scheduled.original[59].balance).toBeCloseTo(owned.balance, 8);
    expect(scheduled.original[59].balance).toBeCloseTo(21109.35, 2);
    expect(scheduled.originalInterest).toBeCloseTo(loan.interest, 8);
  });

  it("conserves principal and payments at the upper rate and term", () => {
    const loan = fixedLoan(25_000_000, 35, 600);
    const rows = amortize(loan.principal, 35, loan.monthly, 600);
    expect(rows.at(-1)?.balance).toBe(0);
    expect(rows.at(-1)?.payment).toBeCloseTo(loan.monthly, 4);
    expect(rows.reduce((total, row) => total + row.principal, 0)).toBeCloseTo(
      loan.principal,
      5,
    );
    expect(rows.reduce((total, row) => total + row.payment, 0)).toBeCloseTo(
      loan.total,
      4,
    );
  });

  it("uses zero remaining balance at and after maturity", () => {
    expect(remainingBalance(12000, 0, 12, 6)).toBe(6000);
    expect(remainingBalance(12000, 0, 12, 12)).toBe(0);
    expect(remainingBalance(12000, 0, 12, 20)).toBe(0);
  });
});

describe("purchase scenarios", () => {
  it("finances negative equity and charges using the supplied tax basis", () => {
    const result = purchaseLoan({
      ...loanInput,
      tradeValue: 12000,
      tradeBalance: 14000,
      taxable: 33000,
      taxRate: 6,
      dealerFees: 300,
      otherFees: 20,
      feeMode: "finance",
    });
    expect(result.charges).toBe(2300);
    expect(result.equity).toBe(-2000);
    expect(result.loan.principal).toBe(40300);
    expect(result.upfront).toBe(9000);
  });
  it("subtracts positive equity and accounts for an excess trade credit", () => {
    const result = purchaseLoan({
      ...loanInput,
      price: 10000,
      taxable: 10000,
      down: 0,
      tradeValue: 12000,
      dealerFees: 500,
    });
    expect(result.loan.principal).toBe(0);
    expect(result.surplus).toBe(1500);
    expect(result.acquisitionCash).toBe(-1500);
    expect(
      purchaseLoan({ ...loanInput, tradeValue: 12000, tradeBalance: 8000 }).loan
        .principal,
    ).toBe(32000);
  });
  it("keeps upfront fees separate for a cash purchase", () => {
    const scenario = purchaseLoan({
      ...loanInput,
      down: 100,
      taxRate: 6,
      dealerFees: 300,
    });
    expect(scenario.loan.months).toBe(0);
    expect(scenario.upfront).toBe(48000);
  });
  it("rejects invalid runtime enum values and excessive taxable amounts", () => {
    expect(() =>
      purchaseLoan({ ...loanInput, feeMode: "invalid" as "upfront" }),
    ).toThrow(/payment method/);
    expect(() =>
      purchaseLoan({ ...loanInput, downMode: "invalid" as "percent" }),
    ).toThrow(/down payment unit/);
    expect(() => purchaseLoan({ ...loanInput, taxable: 45001 })).toThrow(
      /Taxable/,
    );
    expect(() =>
      calculateBoatCost({
        ...illustrativeInputs,
        downPaymentMode: "unknown" as "percent",
      }),
    ).toThrow();
  });
});

describe("affordability constraints", () => {
  it("solves for the binding cash limit with taxes and a percentage down", () => {
    const result = affordability({
      ...budgetInput,
      annualRate: 0,
      taxRate: 5,
      fees: 500,
      cashLimit: 5500,
    });
    expect(result.status).toBe("estimate");
    if (result.status !== "estimate") return;
    expect(result.price).toBe(20000);
    expect(result.upfront).toBe(5500);
    expect(result.loan.principal).toBe(16000);
  });
  it("works with 100% down and reports missing or insufficient cash", () => {
    expect(affordability({ ...budgetInput, down: 100 }).status).toBe(
      "unbounded",
    );
    expect(
      affordability({ ...budgetInput, down: 100, cashLimit: 10000, taxRate: 0 })
        .status,
    ).toBe("estimate");
    expect(
      affordability({ ...budgetInput, down: 100, cashLimit: 100, fees: 101 })
        .status,
    ).toBe("insufficient-cash");
    expect(affordability({ ...budgetInput, operating: 800 }).status).toBe(
      "over-budget",
    );
  });
  it("handles zero financing budget and a fixed cash contribution", () => {
    const result = affordability({
      ...budgetInput,
      downMode: "amount",
      down: 5000,
      budget: 350,
    });
    expect(result).toMatchObject({
      status: "estimate",
      available: 0,
      price: 5000,
      down: 5000,
      loan: { principal: 0 },
    });
    expect(
      affordability({
        ...budgetInput,
        downMode: "amount",
        down: 5000,
        taxRate: 10,
        cashLimit: 5100,
      }).status,
    ).toBe("insufficient-cash");
  });
});

describe("ownership and resale", () => {
  it("reconciles cash, depreciation, financing and negative resale equity before maturity", () => {
    const result = ownership({
      ...ownershipInput,
      price: 12000,
      down: 0,
      annualRate: 0,
      months: 36,
      years: 1,
      resale: 5000,
      charges: 500,
      storage: "marina",
      fuel: { mode: "usage", hours: 100, gallonsPerHour: 4, pricePerGallon: 5 },
      expenses: {
        ...expenses,
        marina: { value: 100, unit: "monthly" },
        storage: { value: 2000, unit: "annual" },
      },
    });
    expect(result.annualOperating).toBe(3200);
    expect(result.balance).toBe(8000);
    expect(result.equity).toBe(-3000);
    expect(result.periodCash).toBe(7700);
    expect(result.economicCost).toBe(10700);
  });
  it("reconciles cash purchase and periods after payoff", () => {
    expect(
      ownership({
        ...ownershipInput,
        purchase: "cash",
        charges: 1000,
        resale: 30000,
      }),
    ).toMatchObject({ balance: 0, economicCost: 16000, equity: 30000 });
    const result = ownership({
      ...ownershipInput,
      years: 20,
      charges: 500,
      resale: 1000,
    });
    expect(result.balance).toBe(0);
    expect(result.periodLoan).toBe(result.loan.total);
    expect(result.economicCost).toBeCloseTo(
      9000 + 500 + result.loan.total - 1000,
      9,
    );
  });
  it("rejects invalid units and fuel modes", () => {
    expect(() =>
      ownership({
        ...ownershipInput,
        expenses: {
          ...expenses,
          insurance: { value: 10, unit: "week" as "annual" },
        },
      }),
    ).toThrow(/frequency/);
    expect(() =>
      ownership({ ...ownershipInput, fuel: { mode: "other" as "direct" } }),
    ).toThrow(/fuel estimation/);
  });
});

describe("early payoff", () => {
  const zeroInterest = {
    balance: 1000,
    annualRate: 0,
    remaining: { mode: "payment", payment: 300 } as const,
    extra: 25,
    lump: 100,
  };
  it("makes a partial final payment and treats extra principal correctly", () => {
    const result = payoff(zeroInterest);
    expect(result.original.at(-1)?.payment).toBe(100);
    expect(result.accelerated.at(-1)?.payment).toBe(250);
    expect(result.monthsSaved).toBe(1);
    expect(result.interestSaved).toBe(0);
  });
  it("caps a one-time payment at the balance and handles an empty loan", () => {
    expect(payoff({ ...zeroInterest, lump: 1200 })).toMatchObject({
      appliedLump: 1000,
      accelerated: [],
      newPayment: 0,
      monthsSaved: 4,
    });
    expect(payoff({ ...zeroInterest, balance: 0 })).toMatchObject({
      original: [],
      accelerated: [],
      interestSaved: 0,
    });
  });
  it("rejects payments that cannot amortize or would exceed the supported term", () => {
    expect(() =>
      payoff({
        ...zeroInterest,
        annualRate: 12,
        remaining: { mode: "payment", payment: 10 },
      }),
    ).toThrow(/exceed/);
    expect(() =>
      payoff({ ...zeroInterest, remaining: { mode: "payment", payment: 1 } }),
    ).toThrow(/600 months/);
  });
  it("saves interest when payment is accelerated at a positive rate", () => {
    const result = payoff({ ...zeroInterest, annualRate: 12 });
    expect(result.interestSaved).toBeGreaterThan(0);
    expect(result.original.at(-1)?.balance).toBe(0);
    expect(result.accelerated.at(-1)?.balance).toBe(0);
  });
});
