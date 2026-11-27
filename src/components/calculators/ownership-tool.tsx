"use client";

import {
  expenseCategories,
  ownership,
  type Expense,
  type ExpenseEntry,
} from "@/lib/finance/calculators";
import { requireChoice } from "@/lib/finance/loan";
import { money } from "@/lib/formatting/money";
import {
  Breakdown,
  CalculatorPanel,
  ImportScenario,
  Readout,
  TransferButton,
  evaluate,
  termFields,
  terms,
  useScenario,
} from "./tool-ui";

const categories = Object.keys(expenseCategories) as Expense[];
const guidance = {
  pontoon:
    "Ask about storage dimensions, cover replacement and seasonal upholstery care.",
  bowrider:
    "Price trailer service, covers, winter storage and engine maintenance.",
  wake: "Allow for fuel during towing and service for ballast and surf systems.",
  center:
    "Consider engine service intervals, electronics and hours spent offshore.",
  bass: "Check trailer and trolling motor upkeep, including battery replacement.",
  cruiser:
    "Check slip pricing by length and allow for cabin systems and haul-outs.",
  sail: "Budget for rigging inspection, sails and engine service where applicable.",
  pwc: "Include trailer or lift costs and follow the manufacturer’s service schedule.",
  other:
    "Use quotes and maintenance schedules for the specific boat and how you plan to use it.",
} as const;
const defaults = {
  price: "45000",
  purchase: "financed",
  down: "9000",
  annualRate: "7",
  term: "120",
  termUnit: "months",
  charges: "0",
  storageMode: "storage",
  fuelMode: "direct",
  hours: "0",
  gallons: "0",
  fuelPrice: "0",
  years: "5",
  customYears: "7",
  resale: "",
  boatType: "other",
  ...Object.fromEntries(
    categories.flatMap((key) => [
      [
        key,
        (
          {
            fuel: "1200",
            insurance: "600",
            maintenance: "900",
            storage: "1500",
          } as Partial<Record<Expense, string>>
        )[key] ?? "0",
      ],
      [`${key}Unit`, "annual"],
    ]),
  ),
};
const frequencies = [
  ["annual", "Per year"],
  ["monthly", "Per month"],
] as const;

export function OwnershipTool() {
  const s = useScenario(defaults);
  const { result, error } = evaluate(() => {
    requireChoice(
      s.fields.fuelMode,
      ["direct", "usage"],
      "fuel estimation method",
    );
    requireChoice(s.fields.boatType, Object.keys(guidance), "boat type");
    requireChoice(
      s.fields.years,
      ["1", "3", "5", "10", "custom"],
      "ownership period",
    );
    return ownership({
      ...(s.fields.purchase === "cash"
        ? { annualRate: 0, months: 1 }
        : terms(s)),
      price: s.n("price"),
      purchase: s.fields.purchase as "cash" | "financed",
      down: s.n("down"),
      charges: s.n("charges"),
      expenses: Object.fromEntries(
        categories.map((key) => [
          key,
          { value: s.n(key), unit: s.fields[`${key}Unit`] },
        ]),
      ) as Record<Expense, ExpenseEntry>,
      fuel:
        s.fields.fuelMode === "usage"
          ? {
              mode: "usage",
              hours: s.n("hours"),
              gallonsPerHour: s.n("gallons"),
              pricePerGallon: s.n("fuelPrice"),
            }
          : { mode: "direct" },
      storage: s.fields.storageMode as "marina" | "storage" | "none",
      years: s.fields.years === "custom" ? s.n("customYears") : s.n("years"),
      resale: s.fields.resale.trim() ? s.n("resale") : undefined,
    });
  });
  function expense(key: Expense) {
    return (
      <div className="paired-fields" key={key}>
        {s.field(key, expenseCategories[key])}
        {s.choice(
          `${key}Unit`,
          `${expenseCategories[key]} frequency`,
          frequencies,
        )}
      </div>
    );
  }

  return (
    <>
      <CalculatorPanel
        title="Estimated monthly cash outflow"
        summary={result ? money(result.monthlyTotal) : "—"}
        error={error}
        reset={s.reset}
        inputs={
          <>
            {s.choice("boatType", "Boat type", [
              ["other", "Other / unspecified"],
              ["pontoon", "Pontoon"],
              ["bowrider", "Bowrider"],
              ["wake", "Wake boat"],
              ["center", "Center console"],
              ["bass", "Bass boat"],
              ["cruiser", "Cabin cruiser"],
              ["sail", "Sailboat"],
              ["pwc", "Personal watercraft"],
            ])}
            <p className="fine-print">
              {guidance[s.fields.boatType as keyof typeof guidance]}
            </p>
            {s.field("price", "Boat purchase price")}
            {s.choice("purchase", "Purchase method", [
              ["financed", "Financed purchase"],
              ["cash", "Cash purchase"],
            ])}
            {s.fields.purchase === "financed" && (
              <>
                {s.field("down", "Down payment")}
                {termFields(s)}
              </>
            )}
            {s.field("charges", "Upfront acquisition taxes and fees")}
            {s.choice("years", "Ownership period", [
              ["1", "1 year"],
              ["3", "3 years"],
              ["5", "5 years"],
              ["10", "10 years"],
              ["custom", "Custom duration"],
            ])}
            {s.fields.years === "custom" &&
              s.field("customYears", "Custom ownership duration", "years")}
            <label className="tool-select">
              Estimated future resale value (optional)
              <input
                type="text"
                inputMode="decimal"
                value={s.fields.resale}
                onChange={(event) => s.set("resale", event.target.value)}
                placeholder="No resale value entered"
              />
            </label>
            <details className="tool-details">
              <summary>Fuel and operating expenses</summary>
              <div className="fields tool-details-body">
                {s.choice("fuelMode", "Fuel estimation method", [
                  ["direct", "Enter fuel expense"],
                  ["usage", "Estimate from engine usage"],
                ])}
                {s.fields.fuelMode === "direct" ? (
                  expense("fuel")
                ) : (
                  <>
                    {s.field("hours", "Annual engine hours", "hours")}
                    {s.field(
                      "gallons",
                      "Estimated fuel consumption",
                      "gal/hour",
                    )}
                    {s.field("fuelPrice", "Fuel price per gallon")}
                    <p className="fine-print">
                      Fuel burn depends on the boat, engine, load, speed and
                      operating conditions.
                    </p>
                  </>
                )}
                {s.choice("storageMode", "Primary storage arrangement", [
                  ["storage", "Dry storage"],
                  ["marina", "Marina or dock"],
                  ["none", "No paid storage"],
                ])}
                {categories
                  .filter(
                    (key) =>
                      key !== "fuel" &&
                      ((key !== "marina" && key !== "storage") ||
                        key === s.fields.storageMode),
                  )
                  .map(expense)}
              </div>
            </details>
          </>
        }
      >
        {result && (
          <Readout
            items={[
              ["Monthly financing", result.loan.monthly],
              ["Monthly operating expenses", result.monthlyOperating],
              ["Annual operating expenses", result.annualOperating],
              ["First-year recurring cash outflow", result.annualTotal],
              ["Upfront cash", result.initialCash],
              ["Loan payments during ownership", result.periodLoan],
              ["Operating expenses during ownership", result.periodOperating],
              ["Ownership period cash outflow before sale", result.periodCash],
              ["Remaining loan balance", result.balance],
              [
                "Estimated resale equity",
                result.equity ?? "Enter resale value",
              ],
              [
                "Net economic ownership cost",
                result.economicCost ?? "Enter resale value",
              ],
            ]}
          />
        )}
        <p className="result-note">
          Monthly cash flow shows the starting run rate. The ownership total
          counts loan payments only through payoff. A sale adds any remaining
          payoff and subtracts the resale proceeds.
        </p>
      </CalculatorPanel>
      <ImportScenario
        path="/boat-ownership-cost-calculator"
        scenario={s}
        keys={["price", "down", "annualRate", "term", "charges"]}
      />
      {result && (
        <section className="tool-extras">
          <h2>Annual operating expense breakdown</h2>
          <Breakdown
            items={result.categories.map(({ key, annual }) => [
              expenseCategories[key],
              annual,
            ])}
          />
          <TransferButton
            destination="/boat-affordability-calculator"
            values={{ operating: String(result.monthlyOperating) }}
          >
            Send operating budget to affordability calculator
          </TransferButton>
        </section>
      )}
    </>
  );
}
