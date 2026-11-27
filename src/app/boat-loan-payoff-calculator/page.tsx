import { PayoffTool } from "@/components/calculators/payoff-tool";
import { CalculatorPage } from "@/components/layout/calculator-page";
import { toolContent } from "@/content/calculators";
import { pageMetadata } from "@/lib/seo/metadata";

const path = "/boat-loan-payoff-calculator";
export const metadata = pageMetadata(path);

export default function Page() {
  return (
    <CalculatorPage path={path} {...toolContent[path]}>
      <PayoffTool />
    </CalculatorPage>
  );
}
