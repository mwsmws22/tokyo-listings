import {
  DEFAULT_SCRAPE_USER_AGENT,
  type BrowserHeaderProfile,
} from "../fetch/browserHeaders";

export type ScrapeEnv = {
  globalMaxConcurrent: number;
  perHostMinIntervalMs: number;
  perHostMaxInFlight: number;
  fetchTimeoutMs: number;
  maxBodyBytes: number;
  /** Effective User-Agent (from `SCRAPE_USER_AGENT` or default Chrome-like string). */
  userAgent: string;
  headerProfile: BrowserHeaderProfile;
  acceptLanguage: string;
  /** Extra attempts on HTTP 202/403/429/503 (see `fetchListingHtml`). */
  fetchRetries: number;
  fetchRetryDelayMs: number;
};

const SCRAPE_DEFAULTS: ScrapeEnv = {
  globalMaxConcurrent: 4,
  perHostMinIntervalMs: 1500,
  perHostMaxInFlight: 1,
  fetchTimeoutMs: 15_000,
  maxBodyBytes: 5_000_000,
  userAgent: DEFAULT_SCRAPE_USER_AGENT,
  headerProfile: "auto",
  acceptLanguage: "en-US,en;q=0.5",
  fetchRetries: 0,
  fetchRetryDelayMs: 1000,
};

export function loadScrapeEnv(env: NodeJS.ProcessEnv | undefined = process.env): ScrapeEnv {
  // Scrape tuning is intentionally code-configured (not env-configured) to avoid over-parameterization.
  void env;
  const resolved: ScrapeEnv = {
    ...SCRAPE_DEFAULTS,
    // Keep the type explicit so future edits to BrowserHeaderProfile remain type-checked here.
    headerProfile: SCRAPE_DEFAULTS.headerProfile as BrowserHeaderProfile,
  };
  return resolved;
}
