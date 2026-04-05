const SUPPORTED_HOSTS = new Set([
  "www.athome.co.jp",
  "athome.co.jp",
  "www.suumo.jp",
  "suumo.jp",
  "www.homes.co.jp",
  "homes.co.jp",
]);

/** True when the URL host is one we can server-side scrape for preview. */
export function isSupportedListingHostUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return false;
    }
    return SUPPORTED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}
