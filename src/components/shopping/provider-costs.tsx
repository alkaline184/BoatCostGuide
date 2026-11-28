"use client";

import { costProjection } from "@/lib/marine/shopping";
import { money } from "@/lib/formatting/money";
import { budgetValues, FinanceFields, useShoppingForm } from "./shopping-forms";

export function ProviderCosts({ names }: { names: string[] }) {
  const form = useShoppingForm({ operating: "", price: "" });
  const [first, second, third] = [
    useShoppingForm({ price: "" }),
    useShoppingForm({ price: "" }),
    useShoppingForm({ price: "" }),
  ];
  const boats = [first, second, third].slice(0, names.length);
  const output = boats.map((boat) => {
    if (!boat.values.price.trim() || !form.values.operating.trim()) return null;
    try {
      return costProjection(
        Number(boat.values.price),
        budgetValues(form.values),
        form.values.resale.trim() ? Number(form.values.resale) : undefined,
      );
    } catch {
      return null;
    }
  });
  return (
    <section className="catalog-scenario">
      <h2>Compare ownership costs</h2>
      <p>
        Enter each purchase quote in USD and shared operating and financing
        assumptions. Reference prices are indicative and excluded from these
        calculations.
      </p>
      <FinanceFields form={form} resale />
      <div className="shop-fields">
        {boats.map((boat, i) => (
          <label className="tool-select" key={i}>
            {names[i]} purchase quote (USD)
            <input
              type="number"
              min="0"
              step="any"
              value={boat.values.price}
              onChange={(event) => boat.set("price", event.target.value)}
            />
          </label>
        ))}
      </div>
      <div
        className="tool-table catalog-table"
        tabIndex={0}
        role="region"
        aria-label="Ownership comparison results"
      >
        <table>
          <caption>Ownership estimates in USD</caption>
          <thead>
            <tr>
              <th scope="col">Estimate</th>
              {names.map((name, i) => (
                <th key={i} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Monthly financing", "payment"],
                ["Monthly cash outflow", "monthly"],
                ["Five-year cash outflow", "periodCash"],
                ["Remaining loan after five years", "balance"],
                ["Net ownership cost after resale", "net"],
              ] as const
            ).map(([label, key]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                {output.map((result, i) => (
                  <td key={i}>
                    {result?.[key] == null ? "Unavailable" : money(result[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
