/**
 * Listing URL normalization for scraping:
 * - Removes common marketing/tracking query params (utm_*, gclid, etc.).
 * - **Suumo / LIFULL HOME'S**: strips the entire query string (`?bc=…`, `?bid=…`, etc.) —
 *   listing identity is in the path; params are branch/tracking noise.
 * - Strips hash fragments (not sent to server; avoids duplicate cache keys).
 * - Other hosts (e.g. Athome): non-tracking query params may remain if the site needs them.
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

function hostStripsAllQuery(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "suumo.jp" || h === "www.suumo.jp" || h === "homes.co.jp" || h === "www.homes.co.jp";
}

export function canonicalizeListingUrl(urlString: string): string {
  const u = new URL(urlString);
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
  return u.toString();
}
