export type ScrapeEnv = {
  globalMaxConcurrent: number;
  perHostMinIntervalMs: number;
  perHostMaxInFlight: number;
  fetchTimeoutMs: number;
  maxBodyBytes: number;
};

function readInt(env: NodeJS.ProcessEnv | undefined, key: string, fallback: number): number {
  const raw = env?.[key];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function loadScrapeEnv(env: NodeJS.ProcessEnv | undefined = process.env): ScrapeEnv {
  return {
    globalMaxConcurrent: Math.max(1, readInt(env, "SCRAPE_GLOBAL_MAX_CONCURRENT", 4)),
    perHostMinIntervalMs: Math.max(0, readInt(env, "SCRAPE_PER_HOST_MIN_INTERVAL_MS", 1500)),
    perHostMaxInFlight: Math.max(1, readInt(env, "SCRAPE_PER_HOST_MAX_INFLIGHT", 1)),
    fetchTimeoutMs: Math.max(1000, readInt(env, "SCRAPE_FETCH_TIMEOUT_MS", 15_000)),
    maxBodyBytes: Math.max(100_000, readInt(env, "SCRAPE_MAX_BODY_BYTES", 5_000_000)),
  };
}
