import { describe, expect, it } from "vitest";
import { canonicalizeListingUrl } from "../../src/core/url";

describe("canonicalizeListingUrl", () => {
  it("strips the entire query string for suumo.jp (e.g. ?bc=)", () => {
    expect(
      canonicalizeListingUrl("https://suumo.jp/chintai/jnc_000105536591/?bc=100497715526"),
    ).toBe("https://suumo.jp/chintai/jnc_000105536591/");
  });

  it("strips the entire query string for homes.co.jp (e.g. ?bid=)", () => {
    expect(
      canonicalizeListingUrl(
        "https://www.homes.co.jp/chintai/room/6248a82beea587038f6783aad23dd34407591709/?bid=1114400194825",
      ),
    ).toBe("https://www.homes.co.jp/chintai/room/6248a82beea587038f6783aad23dd34407591709/");
  });

  it("still removes tracking params on other hosts without dropping unrelated query keys", () => {
    const out = canonicalizeListingUrl("https://www.athome.co.jp/chintai/1/?utm_source=x&foo=bar");
    expect(out).toContain("foo=bar");
    expect(out).not.toContain("utm_source");
  });
});
