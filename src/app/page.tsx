import { boatTypes } from "@/content/boat-types";
import { CalculatorDirectory } from "@/components/layout/calculator-page";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronDown, Compass, Gauge, Wallet } from "lucide-react";
import { BoatCostCalculator } from "@/components/calculators/boat-cost-calculator";
import { site } from "@/config/site";
import { expenses, questions } from "@/content/guides";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/");

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/apple-touch-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: site.url,
      description: site.description,
      inLanguage: "en-US",
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <section className="discovery-hero" aria-labelledby="home-title">
        <picture>
          <source
            media="(max-width: 650px)"
            type="image/avif"
            srcSet="/marine/hero-mobile-420.avif 420w, /marine/hero-mobile-600.avif 600w"
            sizes="100vw"
          />
          <Image
            src="/marine/hero.webp"
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="discovery-hero-image"
          />
        </picture>
        <div className="container discovery-hero-content">
          <p className="editorial-kicker">Boat research &amp; ownership</p>
          <h1 id="home-title">
            Find your perfect boat. <em>Know what it really costs.</em>
          </h1>
          <p>
            Explore boat types, understand what fits your time on the water, and
            build a budget for the seasons ahead.
          </p>
          <div className="discovery-actions">
            <a href="#explore" className="button discovery-primary">
              Explore boat types
            </a>
            <a href="#calculators" className="button discovery-secondary">
              Plan your budget
            </a>
          </div>
        </div>
      </section>
      <section id="explore" className="section discovery-section">
        <div className="container">
          <div className="discovery-section-head">
            <div>
              <p className="editorial-kicker">Explore boats</p>
              <h2>Find your kind of boating.</h2>
            </div>
            <p>
              Open a boat type to see what to look for and what to budget for.
            </p>
          </div>
          <ul className="boat-category-grid">
            {boatTypes.map(({ id, name, use, detail, image }) => (
              <li key={id}>
                <details className="boat-category">
                  <summary>
                    <div className="boat-category-image">
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(max-width: 520px) 46vw, (max-width: 850px) 45vw, 24vw"
                      />
                    </div>
                    <div className="boat-category-title">
                      <h3>{name}</h3>
                      <ChevronDown size={18} aria-hidden="true" />
                      <span>{use}</span>
                    </div>
                  </summary>
                  <p>{detail}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section ownership-feature">
        <div className="container editorial-grid">
          <div>
            <p className="editorial-kicker">Ownership intelligence</p>
            <h2>
              Picture the boat.
              <br />
              Price the years ahead.
            </h2>
            <p>
              How you use a boat shapes what you spend on it. Start with a
              shortlist, then turn your quotes and expected use into a plan.
            </p>
            <Link
              href="/boat-ownership-cost-calculator"
              className="button discovery-primary"
            >
              Estimate ownership costs
            </Link>
          </div>
          <ol className="ownership-steps">
            <li>
              <Compass aria-hidden="true" />
              <div>
                <h3>Start with where you boat</h3>
                <p>
                  Think about water conditions, passengers and activities before
                  narrowing down hull types.
                </p>
              </div>
            </li>
            <li>
              <Gauge aria-hidden="true" />
              <div>
                <h3>Check the specs that affect your costs</h3>
                <p>
                  Confirm the exact engine, loaded weight and dimensions to get
                  meaningful fuel, storage and towing estimates.
                </p>
              </div>
            </li>
            <li>
              <Wallet aria-hidden="true" />
              <div>
                <h3>Build a budget that lasts</h3>
                <p>
                  Put operating costs alongside the financing payment, then test
                  what happens if you sell earlier than planned.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section id="calculators" className="section discovery-section">
        <div className="container">
          <div className="discovery-section-head">
            <div>
              <p className="editorial-kicker">Budget tools</p>
              <h2>Run the numbers.</h2>
            </div>
            <p>
              Use your own quotes and assumptions. The calculators run in your
              browser.
            </p>
          </div>
          <CalculatorDirectory />
          <div className="quick-estimate">
            <h3 className="quick-estimate-title">
              Start with a quick estimate
            </h3>
            <BoatCostCalculator />
          </div>
        </div>
      </section>
      <section id="guides" className="section buying-editorial">
        <div className="container editorial-grid">
          <div>
            <p className="section-label">
              <BookOpen size={17} aria-hidden="true" /> Buying guides
            </p>
            <h2>Budget beyond the boat price.</h2>
            <p className="section-intro">
              The purchase price tells you what it takes to buy the boat. Your
              ownership budget tells you what it takes to keep it on the water.
            </p>
            <nav className="jump-links" aria-label="Guide sections">
              <a href="#expenses">Ownership expenses</a>
              <a href="#financing">Financing and budgeting</a>
              <a href="#faq">Frequently asked questions</a>
            </nav>
          </div>
          <div>
            <h3 id="expenses">What to include in your budget</h3>
            <dl className="expense-list">
              {expenses.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section id="financing" className="section financing-section">
        <div className="container editorial-grid">
          <div>
            <h2>Compare the payment and the interest.</h2>
            <p className="section-intro">
              Use the same purchase price to see what changes when you adjust
              the down payment or loan term.
            </p>
          </div>
          <div className="prose">
            <h3>How boat financing works</h3>
            <p>
              Subtract your down payment from the purchase price to find the
              principal. In a fixed-rate monthly loan, each payment covers
              interest on the remaining balance and reduces the principal. As
              the balance falls, more of each payment goes toward principal.
            </p>
            <h3>Build a realistic monthly budget</h3>
            <p>
              Get quotes for the boat, financing, insurance and storage. Add a
              monthly allowance for seasonal costs, repairs and upgrades, then
              check whether the combined amount fits alongside other obligations
              and savings. Keep the upfront purchase costs separate and consider
              how resale value could change.
            </p>
            <h3>How the estimate is calculated</h3>
            <p>
              BoatCostGuide adds the estimated fixed-rate payment to your
              monthly operating allowance and multiplies the result by 12 to
              estimate annual recurring cash outflow during the loan.{" "}
              <Link href="/methodology">Read the calculator methodology</Link>.
            </p>
          </div>
        </div>
      </section>
      <section id="faq" className="section">
        <div className="container editorial-grid">
          <div>
            <h2>Boat cost questions</h2>
          </div>
          <div className="faq">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={19} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
