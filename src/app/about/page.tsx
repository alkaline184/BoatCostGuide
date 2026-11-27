import Link from "next/link";
import { Article } from "@/components/layout/article";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/about");

export default function About() {
  return (
    <Article title="About BoatCostGuide" summary={site.tagline}>
      <h2>Plan the purchase and the years after it</h2>
      <p>
        BoatCostGuide builds independent financial planning tools for people
        buying and owning boats in the United States. Start with a purchase
        price, compare fixed-rate loan scenarios and add the costs that come
        with keeping your boat ready to use.
      </p>
      <h2>Work from your own numbers</h2>
      <p>
        The <Link href="/#calculator">boat cost calculator</Link> is free and
        requires no account. Its starting values illustrate how the tool works.
        For a buying decision, use actual quotes and an operating estimate that
        reflects where and how you boat.
      </p>
      <h2>See how the numbers work</h2>
      <p>
        We publish the{" "}
        <Link href="/methodology">formulas, assumptions and exclusions</Link> so
        you can compare estimates with a lender’s payment schedule and build a
        budget around your plans.
      </p>
    </Article>
  );
}
