import { describe, expect, test } from "vitest";
import {
  DEFAULT_SCRAPE_USER_AGENT,
  DEFAULT_SCRAPE_USER_AGENT_FIREFOX,
  buildBrowserLikeHeaders,
  inferRefererForListingUrl,
} from "../../src/fetch/browserHeaders";

describe("browserHeaders", () => {
  test("inferRefererForListingUrl maps known portals", () => {
    expect(inferRefererForListingUrl("https://www.homes.co.jp/chintai/room/abc/")).toBe(
      "https://www.homes.co.jp/chintai/tokyo/23ku-mcity/",
    );
    expect(inferRefererForListingUrl("https://suumo.jp/chintai/jnc_000/")).toBe(
      "https://suumo.jp/chintai/",
    );
    expect(inferRefererForListingUrl("https://www.athome.co.jp/chintai/1/")).toBe(
      "https://www.athome.co.jp/chintai/",
    );
  });

  test("buildBrowserLikeHeaders sets Sec-Fetch-* and Referer for Homes", () => {
    const ua = DEFAULT_SCRAPE_USER_AGENT;
    const h = buildBrowserLikeHeaders("https://www.homes.co.jp/chintai/room/x/", ua);
    expect(h["User-Agent"]).toBe(ua);
    expect(h.Referer).toBe("https://www.homes.co.jp/chintai/tokyo/23ku-mcity/");
    expect(h["Sec-Fetch-Site"]).toBe("same-origin");
    expect(h["Sec-Fetch-Dest"]).toBe("document");
    expect(h["Accept-Language"]).toBe("en-US,en;q=0.5");
    expect(h["Sec-CH-UA"]).toContain("Chrome");
  });

  test("buildBrowserLikeHeaders supports Firefox profile without Sec-CH-*", () => {
    const h = buildBrowserLikeHeaders(
      "https://www.homes.co.jp/chintai/room/x/",
      DEFAULT_SCRAPE_USER_AGENT_FIREFOX,
      "firefox",
      "en-US,en;q=0.5",
    );
    expect(h["User-Agent"]).toContain("Firefox");
    expect(h["Accept-Language"]).toBe("en-US,en;q=0.5");
    expect(h["Sec-Fetch-Site"]).toBe("same-origin");
    expect(h["TE"]).toBe("trailers");
    expect(h["Priority"]).toBe("u=0, i");
    expect(h["Sec-CH-UA"]).toBeUndefined();
  });
});
