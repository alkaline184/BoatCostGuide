import type { MetadataRoute } from "next";
import { pages, site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.keys(pages).map((path) => ({
    url: new URL(path, site.url).href,
  }));
}
