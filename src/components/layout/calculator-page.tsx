import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  calculators,
  calculatorPaths,
  type CalculatorPath,
} from "@/config/calculators";
import { site } from "@/config/site";

export function CalculatorDirectory({
  exclude,
  advanced = false,
}: {
  exclude?: CalculatorPath;
  advanced?: boolean;
}) {
  return (
    <ul className="calculator-directory">
      {calculatorPaths
        .filter((path) => path !== exclude)
        .map((path) => (
          <li key={path}>
            <Link href={path}>
              <strong>{calculators[path].name}</strong>
              <span>{calculators[path].action}</span>
            </Link>
          </li>
        ))}
      {advanced && (
        <li>
          <Link href="/methodology">
            <strong>Calculator methodology</strong>
            <span>Review formulas, assumptions and rounding.</span>
          </Link>
        </li>
      )}
    </ul>
  );
}

export function CalculatorPage({
  path,
  intro,
  children,
  guide,
  topics,
  faq,
}: {
  path: CalculatorPath;
  intro: string;
  children: ReactNode;
  guide: string;
  topics: readonly (readonly [string, string])[];
  faq: readonly (readonly [string, string])[];
}) {
  const { name } = calculators[path];
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
      { "@type": "ListItem", position: 2, name, item: `${site.url}${path}` },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
        }}
      />
      <header className="tool-header">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{name}</span>
          </nav>
          <h1>{name}</h1>
          <p>{intro}</p>
        </div>
      </header>
      <div className="container tool-body">
        {children}
        <div className="tool-editorial">
          <section className="editorial-grid">
            <h2>{guide}</h2>
            <div className="prose">
              {topics.map(([heading, text]) => (
                <div className="guide-topic" key={heading}>
                  <h3>{heading}</h3>
                  <p>{text}</p>
                </div>
              ))}
              <p>
                <Link href="/methodology">Read the calculator methodology</Link>
              </p>
            </div>
          </section>
          <section className="editorial-grid">
            <h2>Frequently asked questions</h2>
            <div className="faq">
              {faq.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={19} aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
          <section>
            <h2>Related calculators</h2>
            <CalculatorDirectory exclude={path} advanced />
          </section>
        </div>
      </div>
    </>
  );
}
