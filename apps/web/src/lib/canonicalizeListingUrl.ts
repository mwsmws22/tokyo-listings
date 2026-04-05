/**
 * Browser-safe copy of `packages/scraping/src/core/url.ts` — keep in sync.
 * (Do not import `@tokyo-listings/scraping` from client components: Node-only deps.)
 */
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
  for (const key of [...u.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower) || lower.startsWith("utm_")) {
      u.searchParams.delete(key);
    }
  }
  u.hash = "";
  return u.toString();
}
