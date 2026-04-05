/**
 * Browser-shaped request metadata for listing HTML fetches. Many portals and CDNs
 * expect navigation-like headers; bare `User-Agent` alone is easy to fingerprint.
 */

/** Public Chrome-style UA (Windows desktop). Bump periodically to stay plausible. */
export const DEFAULT_SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function chromeMajorVersionFromUserAgent(userAgent: string): string {
  const m = /Chrome\/(\d+)/.exec(userAgent);
  return m?.[1] ?? "131";
}

/**
 * Referer for cold listing URL fetches: pretend navigation from each portal’s chintai top.
 * Helps `Sec-Fetch-Site: same-origin` match real browser flows from search → detail.
 */
export function inferRefererForListingUrl(url: string): string | undefined {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  if (hostname === "www.homes.co.jp" || hostname === "homes.co.jp") {
    return "https://www.homes.co.jp/chintai/";
  }
  if (hostname === "www.suumo.jp" || hostname === "suumo.jp") {
    return "https://suumo.jp/chintai/";
  }
  if (hostname === "www.athome.co.jp" || hostname === "athome.co.jp") {
    return "https://www.athome.co.jp/chintai/";
  }
  return undefined;
}

export function buildBrowserLikeHeaders(targetUrl: string, userAgent: string): Record<string, string> {
  const v = chromeMajorVersionFromUserAgent(userAgent);
  const referer = inferRefererForListingUrl(targetUrl);

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    // Client hints (Chrome sends these on navigation)
    "Sec-CH-UA": `"Google Chrome";v="${v}", "Chromium";v="${v}", "Not_A Brand";v="24"`,
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
  };

  if (referer) {
    headers.Referer = referer;
    headers["Sec-Fetch-Site"] = "same-origin";
  } else {
    headers["Sec-Fetch-Site"] = "none";
  }

  return headers;
}
