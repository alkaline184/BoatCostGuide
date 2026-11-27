import { calculatorPaths, calculators } from "@/config/calculators";
import Link from "next/link";
import { MobileNavigation } from "./mobile-navigation";

const mainLinks = [
  ["/#calculator", "Calculator"],
  ["/#guides", "Guides"],
  ["/about", "About"],
];

const calculatorLinks = calculatorPaths.map((path) => [
  path,
  calculators[path].name,
]);

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="BoatCostGuide home">
      <svg aria-hidden="true" viewBox="0 0 48 48" width="37" height="37">
        <rect width="48" height="48" rx="12" fill="currentColor" />
        <path d="M12 30h24l-5 6H17zM23 12v14H12zm4 4 8 10h-8z" fill="white" />
      </svg>
      <span>
        BoatCost<span className="brand-accent">Guide</span>
      </span>
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main">
          <MobileNavigation
            links={calculatorLinks}
            label="Calculators"
            navigationLabel="Calculators"
          />
          {mainLinks.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button header-cta" href="/#calculator">
          Calculate costs
        </Link>
        <MobileNavigation links={[...mainLinks, ...calculatorLinks]} />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>Independent boating financial tools for US buyers and owners.</p>
          </div>
          <nav aria-label="Footer tools">
            <h2>Explore</h2>
            {calculatorLinks.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/#guides">Boat ownership guide</Link>
            <Link href="/methodology">Methodology</Link>
          </nav>
          <nav aria-label="Footer information">
            <h2>BoatCostGuide</h2>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© BoatCostGuide</p>
          <p>
            Estimates are for general information and do not constitute
            financial advice or a lending offer.
          </p>
        </div>
      </div>
    </footer>
  );
}
