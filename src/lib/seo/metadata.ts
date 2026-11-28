import type { Metadata } from "next";
import { pages, site, type PagePath } from "@/config/site";

export function pageMetadata(
  path: string,
  options?: { title?: string; description?: string; noindex?: boolean },
): Metadata {
  const existing = pages[path as PagePath];
  const title = options?.title ?? existing?.title ?? site.name;
  const description =
    options?.description ?? existing?.description ?? site.description;
  const socialTitle = path === "/" ? title : `${title} | ${site.name}`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    ...(options?.noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        { url: site.socialImage, width: 1200, height: 630, alt: site.tagline },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [site.socialImage],
    },
  };
}
