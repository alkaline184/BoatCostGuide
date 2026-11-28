import { headers } from "next/headers";
import { notFound } from "next/navigation";

export async function isLocalCatalogReview() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.CATALOG_LOCAL_REVIEW !== "1"
  )
    return false;
  const request = await headers();
  const forwarded = request.get("x-forwarded-for");
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(
      request.get("host") ?? "",
    ) ||
    (forwarded &&
      !/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(forwarded)) ||
    request.get("sec-fetch-site") === "cross-site"
  )
    return false;
  return true;
}

export async function requireLocalCatalogReview() {
  if (!(await isLocalCatalogReview())) notFound();
}
