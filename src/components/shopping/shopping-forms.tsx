"use client";

import { useId, useState } from "react";
import type { Budget } from "@/lib/marine/shopping";
import { sampleTerms, shoppingBudget } from "@/lib/marine/shopping";
import { readNumber } from "@/lib/validation/boat-cost";
import { NumericField } from "../ui/numeric-field";

export const termsDefaults = {
  budget: "600",
  operating: "200",
  down: "20",
  downMode: "percent",
  annualRate: "7",
  months: "120",
  cashLimit: "",
  taxRate: "0",
  fees: "0",
  resale: "",
  price: "",
};
export type FormValues = typeof termsDefaults;
export function useShoppingForm(overrides: Partial<FormValues> = {}) {
  const [values, setValues] = useState({ ...termsDefaults, ...overrides });
  return {
    values,
    set(key: keyof FormValues, value: string) {
      setValues((current) => ({ ...current, [key]: value }));
    },
    reset() {
      setValues({ ...termsDefaults, ...overrides });
    },
  };
}
type State = ReturnType<typeof useShoppingForm>;
export function budgetValues(form: FormValues): Budget {
  return {
    budget: readNumber(form.budget),
    operating: readNumber(form.operating),
    down: readNumber(form.down),
    downMode: form.downMode === "amount" ? "amount" : "percent",
    annualRate: readNumber(form.annualRate),
    months: readNumber(form.months),
    taxRate: readNumber(form.taxRate),
    fees: readNumber(form.fees),
    cashLimit: form.cashLimit.trim() ? readNumber(form.cashLimit) : undefined,
  };
}

export function FinanceFields({
  form,
  budget = false,
  price = false,
  resale = false,
}: {
  form: State;
  budget?: boolean;
  price?: boolean;
  resale?: boolean;
}) {
  const id = useId();
  function field(
    key: keyof FormValues,
    label: string,
    unit = "$",
    optional = false,
  ) {
    const value = form.values[key];
    return (
      <NumericField
        id={id + key}
        value={value}
        label={label}
        unit={unit}
        error={
          value && !Number.isFinite(readNumber(value))
            ? "Enter a nonnegative number."
            : undefined
        }
        hint={optional ? "Optional" : undefined}
        onChange={(edited) => form.set(key, edited)}
      />
    );
  }
  return (
    <div className="shop-fields">
      {budget && field("budget", "Total monthly boating budget")}
      {price && field("price", "Purchase price")}
      {field("operating", "Monthly operating expenses")}
      <label className="tool-select">
        Down payment unit
        <select
          value={form.values.downMode}
          onChange={(e) => form.set("downMode", e.target.value)}
        >
          <option value="percent">Percent</option>
          <option value="amount">Dollars</option>
        </select>
      </label>
      {field(
        "down",
        "Down payment",
        form.values.downMode === "amount" ? "$" : "%",
      )}
      {field("annualRate", "Nominal annual interest rate", "%")}
      {field("months", "Loan term", "months")}
      {budget && field("cashLimit", "Upfront cash limit", "$", true)}
      {field("taxRate", "Acquisition tax rate", "%")}
      {field("fees", "Upfront acquisition fees")}
      {resale && field("resale", "Resale estimate after five years", "$", true)}
    </div>
  );
}

export function readBudget(form: FormValues) {
  const input = budgetValues(form);
  try {
    const result = shoppingBudget(input);
    switch (result.status) {
      case "estimate":
        return { cap: result.price, terms: input, note: null };
      case "over-budget":
        return { note: "Operating expenses exceed the monthly budget." };
      case "unbounded":
        return {
          note: "Enter an upfront cash limit to estimate a ceiling for a full cash purchase.",
        };
      case "insufficient-cash":
        return {
          note: "The cash limit cannot cover these upfront assumptions.",
        };
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { note: error.message };
  }
}
export const sampleNote = `${sampleTerms.down}% down · ${sampleTerms.annualRate}% nominal interest · ${sampleTerms.months} months`;
