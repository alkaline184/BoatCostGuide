import { publicCatalog } from "@/lib/marine/catalog-server";
import { categoryMap, modelPath } from "@/lib/marine/shopping";
import type { MetadataRoute } from "next";
import { pages, site } from "@/config/site";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const records = publicCatalog();
  const models = new Set(records.map(modelPath));
  const paths = new Set([...Object.keys(pages), ...models]);
  if (records.length) paths.add("/boats");
  for (const brand of new Set(
    records.map((record) => record.manufacturer.id),
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
          .filter((record) => record.model.category === category)
          .map(modelPath),
      ).size >= 2
    )
      paths.add("/boat-types/" + categoryMap[category].slug);
  }
  return Array.from(paths, (path) => ({
    url: new URL(path, site.url).href,
  }));
}
