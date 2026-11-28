import { catalogIdentities } from "@/lib/marine/catalog-server";
import { categoryMap } from "@/lib/marine/shopping";
import type { MetadataRoute } from "next";
import { pages, site } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const records = await catalogIdentities().catch(() => []);
  const modelPath = (record: (typeof records)[number]) =>
    `/boats/${record.manufacturer_slug}/${record.model_slug}`;
  const models = new Set(records.map(modelPath));
  const paths = new Set([...Object.keys(pages), ...models]);
  if (records.length) paths.add("/boats");
  for (const brand of new Set(
    records.map((record) => record.manufacturer_slug),
  )) {
    const prefix = "/boats/" + brand;
    if (
      [...models].filter((model) => model.startsWith(prefix + "/")).length >= 2
    )
      paths.add(prefix);
  }
  for (const category of Object.keys(categoryMap) as Array<
    keyof typeof categoryMap
  >) {
    if (
      new Set(
        records
          .filter((record) => record.category_slug === category)
          .map(modelPath),
      ).size >= 2
    )
      paths.add("/boat-types/" + categoryMap[category].slug);
  }
  return Array.from(paths, (path) => ({
    url: new URL(path, site.url).href,
  }));
}
