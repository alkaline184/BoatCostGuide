# Financial methodology

## Loan and schedules

Monthly rate is nominal annual percent divided by 1,200. The fixed payment is principal times the monthly rate divided by one minus the present-value discount for the term. Near zero, the denominator uses `log1p` and `expm1`. At zero, the payment is principal divided by months. The balance after a fixed payment is the present value of the remaining payments. A fixed schedule uses that prospective balance to avoid accumulating numerical error at high rates and long terms. Payment-mode schedules use recurrence and a smaller final installment. The model uses monthly accrual and assumes regular payments at the end of each month.

Interest equals monthly opening balance times monthly rate. Individual displayed numbers and exported values round to the nearest cent. Totals and cumulative interest are computed from unrounded values, so summing exported lines can differ by cents from the displayed aggregate. Lender accrual, cent rounding, late or early payments, penalties and loan charge rules can differ.

Purchase principal equals price minus down payment and net trade-in equity, plus financed charges, with a floor of zero. The custom taxable amount is a user-entered base. Excess trade equity first offsets remaining upfront charges, then is treated as a cash credit. The acquisition cash total excludes the opportunity cost of the surrendered trade-in asset.

## Affordability

Available payment equals the nonnegative difference between monthly budget and recurring operating expenses. Divide by the fixed payment factor for the principal cap. With fixed down payment D, financing bounds price by principal cap plus D. With proportional down payment d, financing bounds price by principal cap divided by (1 − d). A separate upfront cap solves down payment + price × tax rate + fixed fees ≤ available cash. Take the tighter finite bound. A 100% cash scenario needs an upfront limit. Operating expenses exceeding budget invalidate the overall scenario even when no financing is needed. The returned financing ceiling excludes the upfront constraint, which is reflected in the purchase price.

## Ownership and payoff

Ownership combines upfront cash with the expenses accrued through the selected duration. Loan payments stop at maturity. Sale equity equals resale value less remaining principal. Economic cost equals upfront cash + operating cost + payments made + remaining payoff − resale proceeds. This reconciles to purchase price − resale proceeds + acquisition charges + operating expenses + interest paid. Results use nominal dollars and fixed recurring expense assumptions. No resale value is assumed.

Payoff compares the existing loan with a loan reduced by the immediate lump payment, then adds the monthly extra to the regular payment. A lump payment over the loan balance is capped at the balance. Payment-mode inputs must cover interest and amortize within 600 months. Indexed annual tables summarize actual monthly rows.

## Independent checks

- Decimal present-value check for $36,000 at 7% over 120 months gives $417.9905251870 per month. At month 60 the present value of 60 remaining payments is $21,109.3547865446.
- With a $12,000 zero-interest loan over 36 months, the first year repays $4,000. Add $500 in acquisition charges and $3,200 in operating costs for $7,700 paid. Selling for $5,000 against an $8,000 balance requires $3,000 more cash. Net economic cost is $10,700.
- A $1,000 zero-interest balance at $300 monthly takes four payments, ending with $100. With $100 paid immediately and $25 extra monthly, three payments end with $250.

See the [public methodology](../src/app/methodology/page.tsx) for the validated consumer ranges.
