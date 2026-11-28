import { searchCatalog } from "@/lib/marine/catalog-server";
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
  const scope = text("manufacturerScope");
  const type = text("typeScope");
  const category = Object.entries(categoryMap).find(
    ([, value]) => value.slug === type,
  )?.[0];
  const includePrices = text("priceIndex") === "1";
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const { page } = await searchCatalog(
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
      { manufacturer: scope, category: category ?? (type || undefined) },
      includePrices,
      false,
    );
    return Response.json(page, { headers });
  } catch {
    return Response.json(
      { message: "The boat catalog is temporarily unavailable." },
      { status: 503, headers },
    );
  }
}
