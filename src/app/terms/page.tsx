import Link from "next/link";
import { Article } from "@/components/layout/article";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/terms");

export default function Terms() {
  return (
    <Article
      title="Terms of use"
      summary="BoatCostGuide provides estimates and educational information for boating decisions."
    >
      <h2>Use estimates for planning</h2>
      <p>
        BoatCostGuide tools and guides are for general information. Results
        depend on your inputs and the assumptions in the{" "}
        <Link href="/methodology">calculator methodology</Link>. The example
        rate and expenses are illustrative.
      </p>
      <h2>Verify costs and financing</h2>
      <p>
        Nothing on BoatCostGuide is financial, legal or tax advice, a credit
        decision, a loan offer, or a guarantee about actual costs. Use written
        quotes and review the lender’s disclosures and payment schedule before
        entering into a purchase or financing agreement.
      </p>
      <h2>Availability and acceptable use</h2>
      <p>
        The site and its tools may change as they are maintained. Use them
        lawfully and do not interfere with their operation or other visitors’
        access.
      </p>
    </Article>
  );
}
