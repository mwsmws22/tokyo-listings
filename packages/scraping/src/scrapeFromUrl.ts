import { parseListingPage, resolvePortalFromUrl } from "./core/dispatch";
import { loadScrapeEnv } from "./core/env";
import type { ScrapeResult } from "./core/types";
import { canonicalizeListingUrl } from "./core/url";
import { type FetchLike, FetchListingHtmlError, fetchListingHtml } from "./fetch/fetchListingHtml";
import { createFetchLimiter } from "./fetch/limiter";

export type ScrapeFromUrlOptions = {
  /** Inject for tests (mock fetch). */
  fetchImpl?: FetchLike;
  env?: NodeJS.ProcessEnv;
};

/**
 * Full pipeline: canonicalize URL → resolve portal → rate-limited fetch → portal parser.
 * Phase 2: portal parsers are stubs returning `parse_failed` after a successful fetch.
 */
export async function scrapeFromUrl(
  urlString: string,
  options: ScrapeFromUrlOptions = {},
): Promise<ScrapeResult> {
  let canonicalUrl: string;
  try {
    canonicalUrl = canonicalizeListingUrl(urlString.trim());
  } catch {
    return {
      status: "fetch_failed",
      canonicalUrl: urlString,
      message: "Invalid URL",
      code: "invalid_url",
    };
  }

  let url: URL;
  try {
    url = new URL(canonicalUrl);
  } catch {
    return {
      status: "fetch_failed",
      canonicalUrl,
      message: "Invalid URL",
      code: "invalid_url",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      status: "fetch_failed",
      canonicalUrl,
      message: "Only http(s) URLs are supported",
      code: "invalid_url",
    };
  }

  const portal = resolvePortalFromUrl(url);
  if (!portal) {
    return {
      status: "unsupported_host",
      canonicalUrl,
      message: "This portal is not supported yet. Supported: athome.co.jp, suumo.jp, homes.co.jp.",
    };
  }

  const env = loadScrapeEnv(options.env);
  const limiter = createFetchLimiter({
    globalMaxConcurrent: env.globalMaxConcurrent,
    perHostMinIntervalMs: env.perHostMinIntervalMs,
    perHostMaxInFlight: env.perHostMaxInFlight,
  });

  const hostname = url.hostname;

  try {
    const { html } = await limiter.run(hostname, () =>
      fetchListingHtml({
        url: canonicalUrl,
        timeoutMs: env.fetchTimeoutMs,
        maxBodyBytes: env.maxBodyBytes,
        fetchImpl: options.fetchImpl,
      }),
    );

    return await parseListingPage(portal, html, canonicalUrl);
  } catch (e) {
    if (e instanceof FetchListingHtmlError) {
      return {
        status: "fetch_failed",
        canonicalUrl,
        message: e.message,
        code: e.code === "not_html" ? "http_error" : e.code,
      };
    }
    const message = e instanceof Error ? e.message : "Fetch failed";
    return {
      status: "fetch_failed",
      canonicalUrl,
      message,
      code: "network",
    };
  }
}
