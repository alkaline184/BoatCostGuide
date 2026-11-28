type Query = Record<string, string>;

export class CatalogUnavailable extends Error {}

export async function catalogQuery<T>(
  resource:
    "marine_catalog_read" | "rpc/marine_search" | "rpc/marine_catalog_facets",
  query: Query = {},
  body?: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  const clean = (value?: string) => value?.trim().replace(/^=/, "").trim();
  const endpoint = clean(process.env.BOATCOSTGUIDE_SUPABASE_URL);
  const key = clean(process.env.BOATCOSTGUIDE_SUPABASE_PUBLISHABLE_KEY);
  if (!endpoint && !key) return null;
  if (!endpoint || !key)
    throw new CatalogUnavailable("Incomplete catalog configuration");
  try {
    const url = new URL(`/rest/v1/${resource}`, endpoint);
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(url.hostname)
      )
    )
      throw new Error();
    for (const [name, value] of Object.entries(query))
      url.searchParams.set(name, value);
    const headers: Record<string, string> = { apikey: key };
    if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
    if (body) headers["Content-Type"] = "application/json";
    const response = await fetch(url, {
      headers,
      method: body ? "POST" : "GET",
      body: body && JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) throw new Error();
    return (await response.json()) as T;
  } catch {
    throw new CatalogUnavailable(
      "The boat catalog is temporarily unavailable.",
    );
  }
}
