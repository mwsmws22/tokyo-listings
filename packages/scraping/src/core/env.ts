import { DEFAULT_SCRAPE_USER_AGENT } from "../fetch/browserHeaders";

export type ScrapeEnv = {
  globalMaxConcurrent: number;
  perHostMinIntervalMs: number;
  perHostMaxInFlight: number;
  fetchTimeoutMs: number;
  maxBodyBytes: number;
  /** Effective User-Agent (from `SCRAPE_USER_AGENT` or default Chrome-like string). */
  userAgent: string;
  /** Extra attempts on HTTP 202/403/429/503 (see `fetchListingHtml`). */
  fetchRetries: number;
  fetchRetryDelayMs: number;
};

function readInt(env: NodeJS.ProcessEnv | undefined, key: string, fallback: number): number {
  const raw = env?.[key];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readOptionalTrimmed(env: NodeJS.ProcessEnv | undefined, key: string): string | undefined {
  const raw = env?.[key]?.trim();
  return raw === undefined || raw === "" ? undefined : raw;
}

export function loadScrapeEnv(env: NodeJS.ProcessEnv | undefined = process.env): ScrapeEnv {
  const ua = readOptionalTrimmed(env, "SCRAPE_USER_AGENT");
  return {
    globalMaxConcurrent: Math.max(1, readInt(env, "SCRAPE_GLOBAL_MAX_CONCURRENT", 4)),
    perHostMinIntervalMs: Math.max(0, readInt(env, "SCRAPE_PER_HOST_MIN_INTERVAL_MS", 1500)),
    perHostMaxInFlight: Math.max(1, readInt(env, "SCRAPE_PER_HOST_MAX_INFLIGHT", 1)),
    fetchTimeoutMs: Math.max(1000, readInt(env, "SCRAPE_FETCH_TIMEOUT_MS", 15_000)),
    maxBodyBytes: Math.max(100_000, readInt(env, "SCRAPE_MAX_BODY_BYTES", 5_000_000)),
    userAgent: ua ?? DEFAULT_SCRAPE_USER_AGENT,
    fetchRetries: Math.min(5, Math.max(0, readInt(env, "SCRAPE_FETCH_RETRIES", 0))),
    fetchRetryDelayMs: Math.max(0, readInt(env, "SCRAPE_FETCH_RETRY_DELAY_MS", 1000)),
  };
}
