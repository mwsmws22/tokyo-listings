import { describe, expect, test } from "bun:test";
import {
  buildBrowserLikeHeaders,
  DEFAULT_SCRAPE_USER_AGENT,
  inferRefererForListingUrl,
} from "../../src/fetch/browserHeaders";

describe("browserHeaders", () => {
  test("inferRefererForListingUrl maps known portals", () => {
    expect(inferRefererForListingUrl("https://www.homes.co.jp/chintai/room/abc/")).toBe(
      "https://www.homes.co.jp/chintai/",
    );
    expect(inferRefererForListingUrl("https://suumo.jp/chintai/jnc_000/")).toBe("https://suumo.jp/chintai/");
    expect(inferRefererForListingUrl("https://www.athome.co.jp/chintai/1/")).toBe(
      "https://www.athome.co.jp/chintai/",
    );
  });

  test("buildBrowserLikeHeaders sets Sec-Fetch-* and Referer for Homes", () => {
    const ua = DEFAULT_SCRAPE_USER_AGENT;
    const h = buildBrowserLikeHeaders("https://www.homes.co.jp/chintai/room/x/", ua);
    expect(h["User-Agent"]).toBe(ua);
    expect(h.Referer).toBe("https://www.homes.co.jp/chintai/");
    expect(h["Sec-Fetch-Site"]).toBe("same-origin");
    expect(h["Sec-Fetch-Dest"]).toBe("document");
    expect(h["Accept-Language"]).toContain("ja");
    expect(h["Sec-CH-UA"]).toContain("Chrome");
  });
});
