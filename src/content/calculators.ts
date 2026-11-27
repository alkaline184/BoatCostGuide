import type { CalculatorPath } from "@/config/calculators";

export const toolContent = {
  "/boat-loan-calculator": {
    intro:
      "Estimate your monthly payment, compare loan terms and see where each payment goes. Include your trade-in, sales tax and fees to model the actual purchase.",
    guide: "What changes a boat loan payment?",
    topics: [
      [
        "Start with the amount financed",
        "The lender advances the purchase price after your cash down payment and trade-in equity, plus any taxes and fees you roll into the loan. A trade-in worth $12,000 with $8,000 owed contributes $4,000 in equity. If you owe $14,000 instead, the $2,000 shortfall increases the amount to fund.",
      ],
      [
        "Use the tax basis from your quote",
        "Enter the taxable purchase amount shown on your written estimate when it differs from the sticker price. This calculator never automatically credits a trade-in against taxes. Financing taxes and fees reduces upfront cash and increases the amount that accrues interest.",
      ],
      [
        "Compare the term and the rate",
        "At the same positive rate, spreading repayment over more months generally lowers the payment and raises lifetime interest. A $36,000 loan at an illustrative 7% for 120 months costs about $417.99 per month and $14,158.86 in interest.",
      ],
      [
        "Compare new and used financing on the same basis",
        "Ask lenders how boat age, condition, collateral value and your application affect their quote. Use the nominal interest rate here, then compare the lenders’ disclosed APRs and fees separately. APR and nominal interest serve different purposes.",
      ],
    ],
    faq: [
      [
        "Can I finance taxes and dealer fees?",
        "Select Include in loan to model the cost if the lender allows it. Check the written quote for which charges are eligible.",
      ],
      [
        "Why does the interest portion shrink?",
        "Monthly interest is calculated on the outstanding principal. As that principal falls, more of a level payment goes toward principal.",
      ],
      [
        "Why might a lender’s final payment differ?",
        "A lender can use daily accrual, actual payment dates or cent-by-cent rounding. This schedule applies a monthly model and displays the results in cents.",
      ],
    ],
  },
  "/boat-affordability-calculator": {
    intro:
      "Start with a monthly boating budget and work backward to an estimated purchase price. Include operating expenses and a cash limit if you want to protect savings for other goals.",
    guide: "Set a budget you can sustain.",
    topics: [
      [
        "Reserve money for operating the boat",
        "Collect quotes for insurance, storage and service before choosing a payment. Spread seasonal bills across 12 months. Then subtract that allowance from the monthly amount you have set aside for boating.",
      ],
      [
        "Check monthly financing and upfront cash",
        "The calculator estimates the loan principal your remaining monthly amount can repay. It then solves for the purchase price using your down payment. An upfront cash limit can lower that price when the down payment, taxes and fees would otherwise exceed your available cash.",
      ],
      [
        "Compare cash and financed scenarios",
        "With 100% down, the monthly budget only needs to cover operating costs. Enter an upfront cash limit to give that cash purchase a price ceiling. Leave room for repairs and other expenses you would still need to pay after closing.",
      ],
    ],
    faq: [
      [
        "What if my operating expenses use the whole budget?",
        "There is no room for a monthly loan payment. A cash purchase may still fit if you have enough upfront cash to cover the boat and acquisition charges.",
      ],
      [
        "Does this estimate predict lender approval?",
        "The estimate uses your chosen budget and loan assumptions. A lender separately determines qualification and the terms it can offer.",
      ],
      [
        "Where do taxes and fees go?",
        "This tool applies the entered sales tax rate to the full price and treats taxes and fees as upfront charges. Use the loan calculator to model a custom tax basis or financed costs.",
      ],
    ],
  },
  "/boat-ownership-cost-calculator": {
    intro:
      "Put financing, fuel, storage and upkeep in one budget. See how cash outflow changes over your ownership period and what an estimated sale would mean for the total.",
    guide: "Budget for the years after purchase.",
    topics: [
      [
        "Turn irregular bills into a monthly allowance",
        "Enter insurance, registration, seasonal storage and maintenance in the units you pay them. Monthly costs are averaged across the year. Choose one primary storage arrangement so a dry-storage quote and a marina quote do not both count in the same scenario.",
      ],
      [
        "Estimate fuel for how you actually boat",
        "Enter fuel expenses directly or multiply engine hours by gallons per hour and fuel price. Use a consumption estimate that reflects the specific boat, engine, speed, load and conditions. Update the budget when you have your own usage records.",
      ],
      [
        "Separate cash flow from ownership cost",
        "Cash before sale includes your upfront costs, operating expenses and loan payments made during the period. At sale, add any remaining loan payoff and subtract the resale proceeds. This accounts for the loss in boat value without charging depreciation a second time.",
      ],
      [
        "Budget for an early sale and major repair",
        "Enter a low and high resale estimate in separate scenarios. If resale proceeds are below the balance, you may need cash to retire the loan. Use the repairs and replacement reserve to model expensive work separately from routine maintenance.",
      ],
    ],
    faq: [
      [
        "What happens after the loan is paid off?",
        "The ownership-period total stops adding loan payments at maturity. Operating expenses continue for the entire period.",
      ],
      [
        "Can I estimate ownership cost without a resale value?",
        "Yes. You will see operating expenses, cash paid and the remaining loan balance. Enter a resale estimate if you want to see net economic cost and equity.",
      ],
      [
        "How do I model a boat I buy with cash?",
        "Select Cash purchase to put the full purchase price and acquisition charges upfront. No monthly financing or remaining loan balance is included.",
      ],
    ],
  },
  "/boat-loan-payoff-calculator": {
    intro:
      "Compare your current repayment schedule with extra monthly or one-time principal payments. See the estimated interest and time saved before changing your payment.",
    guide: "Plan an earlier payoff.",
    topics: [
      [
        "Use the remaining balance",
        "Start with the latest principal balance and enter either the remaining term or your scheduled monthly principal-and-interest payment. An exact lender payoff quote may include accrued daily interest or fees beyond that balance.",
      ],
      [
        "Test extra payments separately",
        "A one-time amount reduces principal before the first modeled month. The monthly extra is added to your existing regular payment. Both reduce the balance that earns interest in later months.",
      ],
      [
        "Confirm how the lender applies extra amounts",
        "Ask how to designate a principal payment and check for any prepayment charges. Some servicers advance a due date when an extra amount is received. The accelerated model assumes the regular monthly schedule continues until the balance reaches zero.",
      ],
    ],
    faq: [
      [
        "Does early payoff save interest on a zero-interest loan?",
        "A larger payment can shorten the schedule. There is no interest to save when the rate is zero.",
      ],
      [
        "What happens if my one-time payment exceeds the balance?",
        "The estimate applies only the outstanding principal. The extra amount is excluded, and no future scheduled payment is shown.",
      ],
      [
        "Why is my scheduled payment rejected?",
        "A payment must exceed the first month’s interest and repay the modeled loan within the supported term. Check that the amount entered is principal and interest combined.",
      ],
    ],
  },
} as const satisfies Record<
  CalculatorPath,
  {
    intro: string;
    guide: string;
    topics: readonly (readonly [string, string])[];
    faq: readonly (readonly [string, string])[];
  }
>;
