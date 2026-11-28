import { setTimeout as delay } from "node:timers/promises";

const origin = "https://api.theboatdb.com";
export const object = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const list = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
export const str = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;
export const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export class BoatDbError extends Error {
  readonly code: string;
  readonly status?: number;
  constructor(code: string, status?: number) {
    super(`TheBoatDB: ${code}`);
    this.code = code;
    this.status = status;
  }
}

const safeErrors = new Set([
  "MISSING_API_KEY",
  "INVALID_API_KEY",
  "INSUFFICIENT_SCOPE",
  "FORBIDDEN",
  "TEST_KEY_RESTRICTED",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "NOT_FOUND",
]);

export function boatDbKeyKind(key: string) {
  if (/^[a-z0-9]+_live_/i.test(key)) return "live";
  if (/^[a-z0-9]+_test_/i.test(key)) return "test";
  return "unknown";
}

export function createBoatDbClient({
  key,
  ceiling = 250,
  paceMs = 6000,
  fetcher = fetch,
}: {
  key: string;
  ceiling?: number;
  paceMs?: number;
  fetcher?: typeof fetch;
}) {
  if (boatDbKeyKind(key) !== "live") throw new BoatDbError("LIVE_KEY_REQUIRED");
  let queue = Promise.resolve();
  let nextRequest = 0;
  let stopped: string | undefined;
  const stats = {
    attempts: 0,
    successful: 0,
    failed: 0,
    remaining: null as number | null,
    quota: null as number | null,
    rate: null as number | null,
    quotaReset: null as number | null,
    lastStatus: null as number | null,
    lastDurationMs: null as number | null,
    lastContentType: null as string | null,
  };
  const ceilingLimit = Number.isInteger(ceiling)
    ? Math.max(1, Math.min(250, ceiling))
    : 250;

  async function request(
    path: string,
    query: Record<string, string | number> = {},
    signal?: AbortSignal,
  ) {
    const url = new URL("/v1" + path, origin);
    for (const [name, value] of Object.entries(query))
      url.searchParams.set(name, String(value));
    for (let attempt = 0; ; attempt++) {
      if (stopped) throw new BoatDbError(stopped);
      if (stats.attempts >= ceilingLimit)
        throw new BoatDbError("EVALUATION_LIMIT");
      const wait = nextRequest - Date.now();
      if (wait > 0) await delay(wait, undefined, { signal });
      signal?.throwIfAborted();
      const started = Date.now();
      stats.attempts++;
      nextRequest = started + Math.max(6000, paceMs);
      try {
        const timeout = AbortSignal.timeout(15000);
        const response = await fetcher(url, {
          headers: {
            Authorization: `Bearer ${key}`,
            Accept: "application/json",
          },
          redirect: "error",
          cache: "no-store",
          signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
        });
        const header = (name: string) => {
          const raw = response.headers.get(name);
          return raw && /^\d+$/.test(raw) ? Number(raw) : null;
        };
        stats.remaining = header("x-quota-remaining");
        stats.quota = header("x-quota-limit");
        stats.rate = header("x-ratelimit-limit");
        stats.quotaReset = header("x-quota-reset");
        stats.lastStatus = response.status;
        stats.lastContentType =
          response.headers.get("content-type")?.split(";")[0] ===
          "application/json"
            ? "application/json"
            : "other";
        if (stats.lastContentType !== "application/json")
          throw new BoatDbError("UNEXPECTED_CONTENT_TYPE", response.status);
        const body = object(await response.json());
        if (response.ok) {
          if (stats.remaining === 0) stopped = "QUOTA_EXCEEDED";
          stats.successful++;
          return body;
        }
        const reported = str(object(body.error).code) ?? "";
        const code = safeErrors.has(reported) ? reported : "HTTP_ERROR";
        if (
          response.status === 401 ||
          response.status === 403 ||
          code === "QUOTA_EXCEEDED" ||
          stats.remaining === 0
        )
          stopped = code;
        if (
          attempt < 2 &&
          !stopped &&
          (response.status === 429 || response.status >= 500)
        ) {
          const retryAfter = response.headers.get("retry-after");
          const retryMs = retryAfter
            ? /^\d+$/.test(retryAfter)
              ? Number(retryAfter) * 1000
              : Date.parse(retryAfter) - Date.now()
            : 0;
          if (!Number.isFinite(retryMs) || retryMs > 120000)
            throw new BoatDbError(code, response.status);
          nextRequest = Math.max(
            nextRequest,
            Date.now() + retryMs,
            Date.now() + 1000 * 2 ** attempt,
          );
          stats.failed++;
          continue;
        }
        throw new BoatDbError(code, response.status);
      } catch (error) {
        stats.failed++;
        if (error instanceof BoatDbError) throw error;
        if (attempt >= 2 || signal?.aborted)
          throw new BoatDbError("REQUEST_FAILED");
        nextRequest = Math.max(nextRequest, Date.now() + 1000 * 2 ** attempt);
      } finally {
        stats.lastDurationMs = Date.now() - started;
      }
    }
  }

  function get(
    path: string,
    query?: Record<string, string | number>,
    signal?: AbortSignal,
  ) {
    if (!/^\/(boats|manufacturers)(\/[a-zA-Z0-9_-]+(\/boats)?)?$/.test(path))
      return Promise.reject(new BoatDbError("INVALID_RESOURCE"));
    const result = queue.then(() => request(path, query, signal));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return { get, stats };
}
export type BoatDbClient = ReturnType<typeof createBoatDbClient>;
