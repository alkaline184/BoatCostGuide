import { Article } from "@/components/layout/article";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata("/privacy");

export default function Privacy() {
  return (
    <Article
      title="Privacy policy"
      summary="How BoatCostGuide handles calculator entries and website requests."
    >
      <h2>Calculator entries</h2>
      <p>
        The calculator processes the values you enter in your browser.
        BoatCostGuide does not send those values to its server or to external
        services, store them in cookies or local storage, or require an account.
        Your entries reset when you reload the page.
      </p>
      <h2>Site delivery</h2>
      <p>
        When you load a page, the hosting service receives information needed to
        serve the request, such as your IP address, requested URL and browser
        request headers. The host may process this information for delivery,
        security and troubleshooting.
      </p>
      <h2>Tracking and accounts</h2>
      <p>
        The public site does not set application cookies or include analytics
        scripts, advertising trackers, tracking pixels, forms for personal
        information or fingerprints. The calculator is designed for scenario
        estimates and has no fields for account or identifying information.
      </p>
    </Article>
  );
}
