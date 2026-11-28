import { expect, test, vi } from "vitest";
import {
  createBoatDbClient,
  boatDbKeyKind,
} from "../../src/lib/marine/providers/theboatdb/client";
import {
  createBoatDbRepository,
  mapBoat,
  readPage,
} from "../../src/lib/marine/providers/theboatdb/repository";

const boat = {
  id: "boat-abc",
  slug: "example-model",
  model: "Example",
  type: { slug: "power" },
  production: { firstYear: 2021, lastYear: null },
  unit: "imperial",
  lengthOverall: 22,
  lengthOverallMetres: 6.7056,
  dimensions: { beamOverall: 8, displacement: 4000 },
  referencePrice: { amount: 24000, currency: { code: "EUR" } },
  image: { url: "https://cdn.sanity.io/images/test/example.jpg" },
  gallery: [
    { url: "https://cdn.sanity.io/images/test/example.jpg" },
    { url: "https://other.example/private.jpg" },
  ],
};
const page = { data: [boat], pagination: { total: 1, limit: 12, offset: 0 } };

test("production period, original currency and known units survive normalization", () => {
  const record = mapBoat(boat);
  expect(record).toMatchObject({
    firstYear: 2021,
    lastYear: null,
    unit: "ft",
    lengthMetres: 6.7056,
    beam: 8,
    reference: { amount: 24000, currency: "EUR" },
  });
  expect(record).not.toHaveProperty("modelYear");
  expect(record.photos).toHaveLength(1);
  expect(readPage(page, mapBoat).total).toBe(1);
  expect(() =>
    readPage({ ...page, pagination: { limit: 0 } }, mapBoat),
  ).toThrow("INVALID_PAGE_SCHEMA");
});

test("transport binds credentials to the documented origin and shares cached searches", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json(page, { headers: { "x-quota-remaining": "9999" } }),
    );
  const client = createBoatDbClient({
    key: "demo_live_example",
    ceiling: 1,
    fetcher,
  });
  const repo = createBoatDbRepository(client);
  await expect(
    repo.search({ search: "sea & boat", limit: 12 }),
  ).resolves.toMatchObject({ total: 1 });
  await expect(
    repo.search({ limit: 12, search: "sea & boat" }),
  ).resolves.toMatchObject({ total: 1 });
  const [url, options] = fetcher.mock.calls[0];
  expect(new URL(String(url)).origin).toBe("https://api.theboatdb.com");
  expect(new URL(String(url)).searchParams.get("search")).toBe("sea & boat");
  expect(options?.redirect).toBe("error");
  expect(options?.cache).toBe("no-store");
  await expect(repo.detail("boat-abc")).rejects.toThrow("EVALUATION_LIMIT");
  await expect(client.get("//example.test")).rejects.toThrow(
    "INVALID_RESOURCE",
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(client.stats.remaining).toBe(9999);
});

test("test credentials and permission failures stop authenticated transport", async () => {
  expect(boatDbKeyKind("demo_test_example")).toBe("test");
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        error: {
          code: "INVALID_API_KEY",
          message: "secret should be ignored",
        },
      },
      { status: 401 },
    ),
  );
  expect(() =>
    createBoatDbClient({ key: "demo_test_example", fetcher }),
  ).toThrow("LIVE_KEY_REQUIRED");
  const client = createBoatDbClient({ key: "demo_live_example", fetcher });
  await expect(client.get("/boats")).rejects.toThrow(
    /^TheBoatDB: INVALID_API_KEY$/,
  );
  await expect(client.get("/boats")).rejects.toThrow("INVALID_API_KEY");
  expect(fetcher).toHaveBeenCalledTimes(1);
});
