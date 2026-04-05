import { describe, expect, it } from "vitest";
import { scrapeFromUrl } from "./scrapeFromUrl";

describe("scrapeFromUrl", () => {
  it("returns unsupported_host without fetching for unknown host", async () => {
    const r = await scrapeFromUrl("https://example.com/listing/1");
    expect(r.status).toBe("unsupported_host");
  });

  it("returns fetch_failed for invalid URL", async () => {
    const r = await scrapeFromUrl("not-a-url");
    expect(r.status).toBe("fetch_failed");
    if (r.status === "fetch_failed") {
      expect(r.code).toBe("invalid_url");
    }
  });

  it("returns parse_failed when fetched HTML is not a recognizable Athome detail page", async () => {
    const r = await scrapeFromUrl("https://www.athome.co.jp/chintai/foo/", {
      fetchImpl: async () =>
        new Response("<html><body>ok</body></html>", {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    });
    expect(r.status).toBe("parse_failed");
    if (r.status === "parse_failed") {
      expect(r.portal).toBe("athome");
    }
  });

  it("returns ok when mock fetch returns Athome fixture HTML", async () => {
    const { readFileSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const fixturePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../test/fixtures/athome-detail.sample.html",
    );
    const html = readFileSync(fixturePath, "utf8");
    const r = await scrapeFromUrl("https://www.athome.co.jp/chintai/1107585425/", {
      fetchImpl: async () =>
        new Response(html, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.draft.monthlyRentYen).toBe(125_000);
    }
  });
});
