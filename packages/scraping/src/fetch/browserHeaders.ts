/**
 * Browser-shaped request metadata for listing HTML fetches. Many portals and CDNs
 * expect navigation-like headers; bare `User-Agent` alone is easy to fingerprint.
 */

/** Public Chrome-style UA (Windows desktop). Bump periodically to stay plausible. */
export const DEFAULT_SCRAPE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Optional Firefox-style UA for sites that challenge Chromium-like clients. */
export const DEFAULT_SCRAPE_USER_AGENT_FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0";

export type BrowserHeaderProfile = "auto" | "chrome" | "firefox";

export function chromeMajorVersionFromUserAgent(userAgent: string): string {
  const m = /Chrome\/(\d+)/.exec(userAgent);
  return m?.[1] ?? "131";
}

function inferProfileFromUserAgent(userAgent: string): Exclude<BrowserHeaderProfile, "auto"> {
  if (/Firefox\//i.test(userAgent)) {
    return "firefox";
  }
  return "chrome";
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
    return "https://www.homes.co.jp/chintai/tokyo/23ku-mcity/";
  }
  if (hostname === "www.suumo.jp" || hostname === "suumo.jp") {
    return "https://suumo.jp/chintai/";
  }
  if (hostname === "www.athome.co.jp" || hostname === "athome.co.jp") {
    return "https://www.athome.co.jp/chintai/";
  }
  return undefined;
}

export function buildBrowserLikeHeaders(
  targetUrl: string,
  userAgent: string,
  profile: BrowserHeaderProfile = "auto",
  acceptLanguage = "en-US,en;q=0.5",
): Record<string, string> {
  const resolvedProfile = profile === "auto" ? inferProfileFromUserAgent(userAgent) : profile;
  const v = chromeMajorVersionFromUserAgent(userAgent);
  const referer = inferRefererForListingUrl(targetUrl);

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": acceptLanguage,
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    Priority: "u=0, i",
    TE: "trailers",
  };

  if (resolvedProfile === "chrome") {
    // Client hints for Chromium profile.
    headers["Sec-CH-UA"] = `"Google Chrome";v="${v}", "Chromium";v="${v}", "Not_A Brand";v="24"`;
    headers["Sec-CH-UA-Mobile"] = "?0";
    headers["Sec-CH-UA-Platform"] = '"Windows"';
  }

  if (referer) {
    headers.Referer = referer;
    headers["Sec-Fetch-Site"] = "same-origin";
  } else {
    headers["Sec-Fetch-Site"] = "none";
  }

  return headers;
}
