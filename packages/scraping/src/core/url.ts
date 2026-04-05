/**
 * Listing URL normalization for scraping:
 * - Removes common marketing/tracking query params (utm_*, gclid, etc.).
 * - Strips hash fragments (not sent to server; avoids duplicate cache keys).
 * - Preserves path and remaining query params the listing site may require.
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
