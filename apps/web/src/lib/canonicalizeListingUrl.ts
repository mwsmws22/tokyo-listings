/**
 * Browser-safe copy of `packages/scraping/src/core/url.ts` — keep in sync.
 * (Do not import `@tokyo-listings/scraping` from client components: Node-only deps.)
 */
function hostStripsAllQuery(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "suumo.jp" || h === "www.suumo.jp" || h === "homes.co.jp" || h === "www.homes.co.jp";
}

function isSupportedScrapeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "athome.co.jp" ||
    h === "www.athome.co.jp" ||
    h === "suumo.jp" ||
    h === "www.suumo.jp" ||
    h === "homes.co.jp" ||
    h === "www.homes.co.jp"
  );
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "yclid",
  "mc_eid",
  "ref",
  "icid",
]);

export function canonicalizeListingUrl(urlString: string): string {
  const u = new URL(urlString);
  if (!isSupportedScrapeHost(u.hostname)) {
    return urlString.trim();
  }
  if (hostStripsAllQuery(u.hostname)) {
    u.search = "";
  } else {
    for (const key of [...u.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (TRACKING_PARAMS.has(lower) || lower.startsWith("utm_")) {
        u.searchParams.delete(key);
      }
    }
  }
  u.hash = "";
  if (u.pathname && !u.pathname.endsWith("/")) {
    u.pathname = `${u.pathname}/`;
  }
  return u.toString();
}
