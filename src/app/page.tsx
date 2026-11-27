import { CalculatorDirectory } from "@/components/layout/calculator-page";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Check, ChevronDown } from "lucide-react";
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
      <div className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>
              Your dream boat.
              <br />
              <span>Know the real cost.</span>
            </h1>
            <p>
              Calculate your boat loan payments, uncover the true cost of
              ownership and find out how much boat you can comfortably afford —
              before you buy.
            </p>
            <ul className="trust-list">
              {["Free to use", "Independent", "No sign-up"].map((item) => (
                <li key={item}>
                  <Check size={16} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="hero-image">
              <Image
                src="/open-water.webp"
                alt=""
                fill
                sizes="(max-width: 900px) 1px, 460px"
              />
            </div>
          </div>
          <BoatCostCalculator />
        </div>
      </div>
      <section id="calculators" className="section">
        <div className="container">
          <h2>Boating calculators</h2>
          <CalculatorDirectory />
        </div>
      </section>
      <section id="guides" className="section">
        <div className="container editorial-grid">
          <div>
            <p className="section-label">
              <BookOpen size={17} aria-hidden="true" /> Boat ownership guide
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
