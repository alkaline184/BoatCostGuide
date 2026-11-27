import { describe, expect, it } from "vitest";
import {
  calculateBoatCost,
  downPaymentAmount,
  downPaymentPercent,
  illustrativeInputs,
} from "../../src/lib/finance/boat-cost";
import {
  readNumber,
  validateBoatCost,
} from "../../src/lib/validation/boat-cost";

describe("boat cost engine", () => {
  it("matches independently calculated discounted cash flows for a standard loan", () => {
    // Verified with Python Decimal: sum the present values of 120 unit
    // payments at 7% nominal annual interest, then divide $36,000 by that sum.
    const result = calculateBoatCost(illustrativeInputs);
    expect(result.principal).toBe(36000);
    expect(result.monthlyLoan).toBeCloseTo(417.9905251870466, 9);
    expect(result.monthlyOperating).toBe(350);
    expect(result.monthlyTotal).toBeCloseTo(767.9905251870466, 9);
    expect(result.annualTotal).toBeCloseTo(9215.88630224456, 8);
    expect(result.totalInterest).toBeCloseTo(14158.86302244559, 8);
    expect(result.scheduledPayments).toBeCloseTo(50158.86302244559, 8);
  });

  it("uses straight-line payments at zero interest", () => {
    expect(calculateBoatCost({ ...illustrativeInputs, annualRate: 0 })).toEqual(
      {
        principal: 36000,
        monthlyLoan: 300,
        monthlyOperating: 350,
        monthlyTotal: 650,
        annualTotal: 7800,
        totalInterest: 0,
        scheduledPayments: 36000,
      },
    );
  });

  it.each([
    { downPayment: 100, downPaymentMode: "percent" },
    { downPayment: 45000, downPaymentMode: "amount" },
  ] as const)("supports cash purchases in $downPaymentMode mode", (values) => {
    expect(calculateBoatCost({ ...illustrativeInputs, ...values })).toEqual({
      principal: 0,
      monthlyLoan: 0,
      monthlyOperating: 350,
      monthlyTotal: 350,
      annualTotal: 4200,
      totalInterest: 0,
      scheduledPayments: 0,
    });
  });

  it("converts down payments without clipping intermediate precision", () => {
    const amount = downPaymentAmount(35215.15, 17.25, "percent");
    expect(amount).toBeCloseTo(6074.613375, 8);
    expect(downPaymentAmount(35215.15, amount, "amount")).toBe(amount);
    expect(downPaymentPercent(35215.15, amount)).toBeCloseTo(17.25, 10);
    expect(downPaymentPercent(0, 0)).toBe(0);
  });

  it("stays finite at near-zero rates and valid input extremes", () => {
    expect(
      calculateBoatCost({ ...illustrativeInputs, annualRate: 1e-12 })
        .monthlyLoan,
    ).toBeCloseTo(300, 9);
    const result = calculateBoatCost({
      price: 25_000_000,
      operating: 1_000_000,
      downPayment: 0,
      downPaymentMode: "amount",
      annualRate: 35,
      years: 50,
    });
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
    expect(
      calculateBoatCost({
        ...illustrativeInputs,
        price: 0,
        operating: 0,
        years: 1,
      }).monthlyTotal,
    ).toBe(0);
  });

  it("finds more scheduled interest on a longer loan at the same positive rate", () => {
    const short = calculateBoatCost(illustrativeInputs);
    const long = calculateBoatCost({ ...illustrativeInputs, years: 20 });
    expect(long.monthlyLoan).toBeLessThan(short.monthlyLoan);
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
  });

  it.each([
    { price: -1 },
    { price: NaN },
    { price: 25_000_000 + 1 },
    { annualRate: -1 },
    { annualRate: Infinity },
    { annualRate: 36 },
    { downPayment: -1 },
    { downPayment: 101 },
    { downPaymentMode: "amount" as const, downPayment: 45000.01 },
    { years: 0 },
    { years: 51 },
    { years: 2.5 },
    { operating: Infinity },
    { operating: -1 },
    { operating: 1_000_000 + 1 },
  ])("rejects invalid scenario %j", (values) => {
    const input = { ...illustrativeInputs, ...values };
    expect(Object.keys(validateBoatCost(input))).not.toHaveLength(0);
    expect(() => calculateBoatCost(input)).toThrow(RangeError);
  });
});

describe("numeric entry", () => {
  it.each(["", " ", ".", "1e3", "Infinity", "0x10", "-1", "1,2", "1oops"])(
    "rejects %j",
    (value) => {
      expect(readNumber(value)).toBeNaN();
    },
  );

  it.each([
    ["0", 0],
    [" 2100.05 ", 2100.05],
    [".25", 0.25],
    ["12.", 12],
  ])("reads %j", (value, result) => {
    expect(readNumber(value)).toBe(result);
  });
});
