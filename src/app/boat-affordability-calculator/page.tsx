import { AffordabilityTool } from "@/components/calculators/affordability-tool";
import { CalculatorPage } from "@/components/layout/calculator-page";
import { toolContent } from "@/content/calculators";
import { pageMetadata } from "@/lib/seo/metadata";

const path = "/boat-affordability-calculator";
export const metadata = pageMetadata(path);

export default function Page() {
  return (
    <CalculatorPage path={path} {...toolContent[path]}>
      <AffordabilityTool />
    </CalculatorPage>
  );
}
