import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { boatDbKeyKind, createBoatDbClient } from "./client";
import { createBoatDbRepository } from "./repository";

let repository: ReturnType<typeof createBoatDbRepository> | undefined;

export async function requireLocalBoatDbReview() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.BOATDB_LOCAL_REVIEW !== "1"
  )
    notFound();
  const request = await headers();
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/.test(
      request.get("host") ?? "",
    ) ||
    (request.has("x-forwarded-for") &&
      !/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(
        request.get("x-forwarded-for") ?? "",
      )) ||
    request.get("sec-fetch-site") === "cross-site"
  )
    notFound();
}

export async function localBoatDb() {
  await requireLocalBoatDbReview();
  const key = process.env.THEBOATDB_API_KEY ?? "";
  if (boatDbKeyKind(key) !== "live") return null;
  repository ??= createBoatDbRepository(
    createBoatDbClient({
      key,
      ceiling: Number(process.env.THEBOATDB_EVALUATION_LIMIT ?? 250),
    }),
  );
  return repository;
}
