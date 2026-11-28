import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";

export function ShoppingPage({
  title,
  intro,
  crumbs,
  reviewing,
  children,
}: {
  title: string;
  intro?: string;
  crumbs: Array<[string, string]>;
  reviewing: boolean;
  children: ReactNode;
}) {
  const items = [["Home", "/"], ...crumbs];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: new URL(url, site.url).href,
    })),
  };
  return (
    <>
      {!reviewing && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <header className="tool-header shopping-header">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {items.map(([name, path], i) =>
              i === items.length - 1 ? (
                <span aria-current="page" key={path}>
                  {name}
                </span>
              ) : (
                <Link key={path} href={path}>
                  {name}
                </Link>
              ),
            )}
          </nav>
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
        </div>
      </header>
      <div className="container shopping-body">
        {reviewing && (
          <p className="research-notice">
            Local catalog review. Source facts are verified where shown.
            Commercial publication rights are pending for the review records.
          </p>
        )}
        {children}
      </div>
    </>
  );
}

export function CatalogCoverage() {
  return (
    <section className="catalog-directory-guide">
      <h2>Start with the type of boat</h2>
      <p>
        These official US manufacturer pages can help you check configurations
        and current pricing before budgeting. Ask for a written quote with
        equipment, freight, preparation, and registration itemized.
      </p>
      <div className="catalog-guides">
        <article>
          <h3>Personal watercraft</h3>
          <p>
            Consider the number of riders, the loaded trailer weight and where
            you’ll store it. Verify the capacity for the actual seat
            configuration.
          </p>
          <a href="https://sea-doo.brp.com/us/en/models.html">
            Sea-Doo US models
          </a>
          <a href="https://www.yamahawaverunners.com/">
            Yamaha WaveRunner US lineup
          </a>
          <a href="https://www.kawasaki.com/en-us/watercraft/jetski">
            Kawasaki Jet Ski lineup
          </a>
        </article>
        <article>
          <h3>Jet boats</h3>
          <p>
            Compare the full tow package, low-speed handling and access to the
            pump cleanouts. A price quote can change with engine and trailer
            selection.
          </p>
          <a href="https://www.yamahaboats.com/build-and-price/">
            Yamaha Boats US build and price
          </a>
          <a href="https://www.scarabjetboats.com/us/Boat">Scarab US lineup</a>
        </article>
        <article>
          <h3>Pontoons</h3>
          <p>
            Check overall width against your storage space and the deck layout
            against how you plan to use it. Ask what the quoted package
            includes.
          </p>
          <a href="https://www.suntrackerboats.com/pontoon-boats.html">
            Sun Tracker US lineup
          </a>
          <a href="https://www.benningtonmarine.com/en-us/">
            Bennington US lineup
          </a>
        </article>
      </div>
      <Link className="button" href="/boat-affordability-calculator">
        Find your purchase budget
      </Link>
    </section>
  );
}

export function CatalogUnavailableNotice() {
  return (
    <ShoppingPage
      title="Boat catalog temporarily unavailable"
      intro="Try again shortly. Calculators and buying guides are still available."
      crumbs={[["Boat Explorer", "/boats"]]}
      reviewing={false}
    >
      <Link href="/boats">Boat Explorer</Link>
    </ShoppingPage>
  );
}
