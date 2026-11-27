import Link from "next/link";
import { Article } from "@/components/layout/article";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/methodology");

export default function Methodology() {
  return (
    <Article
      title="Calculator methodology"
      summary="How BoatCostGuide estimates fixed-rate loan payments and recurring boat expenses."
    >
      <h2>Amount financed</h2>
      <p>
        Financed principal equals the purchase price minus the down payment. A
        percentage down payment is calculated by multiplying the purchase price
        by the percentage divided by 100. A full cash purchase has zero
        principal, zero loan payments and zero scheduled interest.
      </p>
      <h2>Monthly loan payment</h2>
      <p>For a fixed-rate loan with equal monthly payments, the payment is:</p>
      <p className="formula">
        <code>
          M = P × r / (1 − (1 + r)<sup>−n</sup>)
        </code>
      </p>
      <ul>
        <li>
          <strong>M</strong> is the estimated monthly payment in USD.
        </li>
        <li>
          <strong>P</strong> is the financed principal.
        </li>
        <li>
          <strong>r</strong> is the nominal annual interest rate expressed as a
          percentage divided by 1,200. The input represents interest only. A
          disclosed APR may also account for fees.
        </li>
        <li>
          <strong>n</strong> is the term in whole years multiplied by 12.
        </li>
      </ul>
      <p>
        At zero interest, the payment is principal divided by the number of
        payments. Total scheduled payments equal the monthly loan payment
        multiplied by the number of payments. Scheduled interest is the
        difference between that total and principal.
      </p>
      <h2>Monthly and annual cash flow</h2>
      <p>
        Monthly cash outflow equals the estimated loan payment plus your monthly
        operating expenses. Annual recurring cash outflow equals 12 times that
        amount during repayment. Divide seasonal or annual bills by 12 before
        entering them in the operating field. The estimate does not project
        those expenses beyond the current scenario.
      </p>
      <h2>Exclusions and rounding</h2>
      <p>
        The model assumes the first payment is one month after funding and
        excludes lender fees, balloon payments, rate changes and prepayments. It
        does not model sales taxes, registration or equipment automatically. Set
        aside one-time purchase costs separately. Include recurring charges in
        your operating estimate.
      </p>
      <p>
        Recurring cash outflow excludes the down payment, depreciation, resale
        proceeds and opportunity cost. Results are displayed to the nearest cent
        after calculation. A lender may use daily interest, different payment
        dates, or rounding rules that change the actual schedule.
      </p>
      <p>
        <Link href="/#calculator">Return to the boat cost calculator</Link>
      </p>
    </Article>
  );
}
