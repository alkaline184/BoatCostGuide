import {
  BoatDbError,
  type BoatDbClient,
  list,
  num,
  object,
  str,
} from "./client.ts";

function link(value: unknown) {
  try {
    const url = new URL(str(value) ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function photo(value: unknown) {
  const row = object(value);
  const url = link(row.url);
  if (!url || new URL(url).hostname !== "cdn.sanity.io") return null;
  return { url, alt: str(row.alt) };
}
const identifier = (value: unknown) => {
  const id = str(value);
  return id && /^[a-z0-9_-]{1,120}$/i.test(id) ? id : null;
};

export function mapBoat(value: unknown) {
  const row = object(value);
  const id = identifier(row.id);
  const slug = identifier(row.slug);
  const model = str(row.model);
  const maker = object(row.manufacturer);
  const production = object(row.production);
  const dimensions = object(row.dimensions);
  const reference = object(row.referencePrice);
  const hull = object(row.hull);
  if (!id || !slug || !model || typeof row.production !== "object")
    throw new BoatDbError("INVALID_BOAT_SCHEMA");
  const amount = num(reference.amount);
  const currency = str(object(reference.currency).code);
  const unit =
    row.unit === "metric" ? "m" : row.unit === "imperial" ? "ft" : null;
  const firstYear = num(production.firstYear);
  const lastYear = num(production.lastYear);
  const year = (value: number | null) =>
    value !== null && Number.isInteger(value) && value >= 1800 && value <= 2100
      ? value
      : null;
  return {
    id,
    slug,
    model,
    version: str(row.version),
    makerId: identifier(maker.id),
    makerSlug: identifier(maker.slug),
    maker: str(maker.name),
    makerWebsite: link(maker.website),
    firstYear: year(firstYear),
    lastYear: year(lastYear),
    type: str(object(row.type).slug),
    categories: list(row.categories).flatMap(
      (item) => str(object(item).name) ?? [],
    ),
    lengthMetres: num(row.lengthOverallMetres),
    beam: unit ? num(dimensions.beamOverall) : null,
    draft: unit ? num(dimensions.draftMax) : null,
    unit,
    hull: str(hull.material) ?? str(object(hull.material).name),
    engines: list(row.engines).map((value) => {
      const engine = object(value);
      return {
        type: str(engine.type) ?? str(object(engine.type).name),
        model: str(engine.model),
        power: num(engine.power),
        powerUnit: str(engine.powerType) ?? str(object(engine.powerType).name),
      };
    }),
    reference:
      amount !== null && amount > 0 && currency && /^[A-Z]{3}$/.test(currency)
        ? { amount, currency }
        : null,
    photos: [
      ...new Map(
        [photo(row.image), ...list(row.gallery).map(photo)].flatMap((item) =>
          item ? [[item.url, item] as const] : [],
        ),
      ).values(),
    ],
    source: `https://theboatdb.com/boat/${slug}`,
  };
}
export type ProviderBoat = ReturnType<typeof mapBoat>;

export function readPage<T>(
  body: Record<string, unknown>,
  map: (value: unknown) => T,
) {
  const { total, limit, offset } = object(body.pagination);
  if (
    !Array.isArray(body.data) ||
    ![total, limit, offset].every(
      (value) =>
        typeof value === "number" && Number.isSafeInteger(value) && value >= 0,
    ) ||
    !limit
  )
    throw new BoatDbError("INVALID_PAGE_SCHEMA");
  return {
    data: body.data.map(map),
    total: total as number,
    limit: limit as number,
    offset: offset as number,
  };
}

export function createBoatDbRepository(client: BoatDbClient) {
  const cache = new Map<string, { expires: number; value: Promise<unknown> }>();
  function cached<T>(key: string, load: () => Promise<T>) {
    const entry = cache.get(key);
    if (entry && entry.expires > Date.now()) return entry.value as Promise<T>;
    if (cache.size >= 64) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    const value = load().catch((error) => {
      if (cache.get(key)?.value === value) cache.delete(key);
      throw error;
    });
    cache.set(key, { expires: Date.now() + 300_000, value });
    return value;
  }
  return {
    search(query: Record<string, string | number>, signal?: AbortSignal) {
      const load = () =>
        client
          .get("/boats", query, signal)
          .then((body) => readPage(body, mapBoat));
      return signal
        ? load()
        : cached(JSON.stringify(Object.entries(query).sort()), load);
    },
    detail(id: string, signal?: AbortSignal) {
      if (!identifier(id)) return Promise.reject(new BoatDbError("INVALID_ID"));
      const load = () =>
        client
          .get("/boats/" + id, {}, signal)
          .then((body) => mapBoat(body.data));
      return signal ? load() : cached("boat:" + id, load);
    },
    makers(search?: string) {
      return client
        .get("/manufacturers", { limit: 20, ...(search ? { search } : {}) })
        .then((body) =>
          readPage(body, (value) => {
            const row = object(value);
            const slug = identifier(row.slug);
            const name = str(row.name);
            if (!slug || !name)
              throw new BoatDbError("INVALID_MANUFACTURER_SCHEMA");
            return { slug, name, logo: !!photo(row.logo) };
          }),
        );
    },
  };
}
