import {
  catalogForRequest,
  publicationDate,
} from "@/lib/marine/catalog-server";
import { paginateCatalog } from "@/lib/marine/catalog-search";
import { categoryMap } from "@/lib/marine/shopping";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = (key: string) => (searchParams.get(key) ?? "").slice(0, 100);
  const numeric = (key: string) => {
    const raw = text(key);
    const value = Number(raw);
    return raw !== "" && Number.isFinite(value) && value >= 0
      ? value
      : undefined;
  };
  const { records, reviewing } = await catalogForRequest();
  const scope = text("manufacturerScope");
  const type = text("typeScope");
  const allowed = records.filter(
    (record) =>
      (!scope || record.manufacturer.id === scope) &&
      (!type || categoryMap[record.model.category].slug === type),
  );
  const includePrices = text("priceIndex") === "1";
  const page = paginateCatalog(
    allowed,
    publicationDate(),
    {
      query: text("query"),
      brand: text("brand"),
      category: text("category"),
      year: numeric("year"),
      minPrice: numeric("minPrice"),
      maxPrice: numeric("maxPrice"),
      minLength: numeric("minLength"),
      minHp: numeric("minHp"),
      passengers: numeric("passengers"),
      propulsion: text("propulsion"),
      sort: includePrices ? "price" : text("sort"),
    },
    Math.floor(numeric("page") ?? 1),
    includePrices,
  );
  return Response.json(page, {
    headers: {
      "Cache-Control": reviewing ? "private, no-store" : "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
