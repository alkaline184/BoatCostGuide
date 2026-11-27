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
      <h2>Detailed purchase and amortization</h2>
      <p>
        Trade-in equity equals trade-in value less its outstanding payoff.
        Positive equity reduces the balance to fund, and negative equity
        increases it. Sales tax equals the chosen taxable amount times the
        entered rate. Acquisition charges include the calculated tax and entered
        fees. Financed charges increase principal. Upfront charges increase
        closing cash. Excess trade-in equity offsets upfront acquisition charges
        before any surplus is reported.
      </p>
      <p>
        The schedule accrues nominal monthly interest on the opening balance.
        Each payment first covers interest, and the remainder reduces principal.
        The last payment is limited to remaining balance plus interest. Annual
        rows sum the monthly rows. Figures and CSV values round individually to
        cents, so adding displayed rows can differ slightly from independently
        rounded totals.
      </p>
      <h2>Affordability</h2>
      <p>
        Monthly financing capacity is the boating budget less operating
        expenses. Divide this capacity by the payment on one dollar of principal
        to estimate the maximum loan. For a fixed down payment, add it to the
        maximum loan. For a percentage down payment below 100%, divide by the
        financed fraction of the price. Upfront cash must cover the down
        payment, full-price sales tax and fixed fees. The tighter of the monthly
        and cash limits determines the price. A 100% down payment needs a cash
        limit to establish a finite maximum.
      </p>
      <h2>Ownership and resale</h2>
      <p>
        Annual operating costs sum the active expense categories. Monthly
        expenses are multiplied by 12, and usage-based fuel equals annual engine
        hours times gallons per hour times price per gallon. The selected
        storage arrangement determines which storage entry counts. Recurring
        cash flow includes operating costs and loan payments scheduled within
        the period measured.
      </p>
      <p>
        Cash paid before sale equals upfront cash, operating costs over the
        selected duration, and loan payments through the earlier of sale or
        maturity. At sale, resale equity equals gross resale value less
        remaining principal. Net economic ownership cost equals cash paid before
        sale plus remaining principal less resale proceeds. Depreciation is
        reflected by the difference between purchase and resale values. Sale
        transaction costs, opportunity cost, inflation and investment returns
        are excluded.
      </p>
      <h2>Extra principal payments</h2>
      <p>
        The payoff calculator compares the original schedule with one that
        applies a one-time amount immediately, capped at the current balance,
        and adds any monthly extra to principal after interest. Enter a
        scheduled payment large enough to amortize within 600 months. The model
        keeps the regular payment fixed, excludes penalties and fees, and can
        produce a smaller final payment.
      </p>
      <h2>Supported calculator inputs</h2>
      <p>
        Purchase prices, loan balances and trade-in amounts accept up to $25
        million. Individual entered operating expenses and acquisition fees
        accept up to $1 million. Rates accept up to 35% nominal interest and 20%
        sales tax. Dedicated loan terms support 1 to 600 whole months and
        ownership periods support 1 to 50 whole years. The introductory
        calculator accepts whole-year terms.
      </p>
      <p>
        <Link href="/#calculator">Return to the boat cost calculator</Link>
      </p>
    </Article>
  );
}
