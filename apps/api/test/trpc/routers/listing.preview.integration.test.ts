import { scrapingPreviewOutputSchema } from "@tokyo-listings/validators/scraping";
import { describe, expect, it } from "vitest";
import { mapScrapeDraftToListingPrefill } from "../../../src/lib/scraping/mapDraftToListingInput";

describe("listing.previewFromUrl data layer", () => {
  it("scrapingPreviewOutputSchema accepts ok athome-shaped payloads", () => {
    const raw = {
      status: "ok" as const,
      portal: "athome" as const,
      canonicalUrl: "https://www.athome.co.jp/chintai/1/",
      draft: {
        monthlyRentYen: 125_000,
        addressText: "東京都渋谷区",
        warnings: [] as string[],
      },
    };
    expect(scrapingPreviewOutputSchema.safeParse(raw).success).toBe(true);
  });

  it("mapScrapeDraftToListingPrefill maps draft + canonical URL", () => {
    const prefill = mapScrapeDraftToListingPrefill(
      { monthlyRentYen: 100_000, warnings: [] },
      "https://www.athome.co.jp/chintai/1/",
      "athome",
    );
    expect(prefill.sourceUrl).toContain("athome.co.jp");
    expect(prefill.sourcePortal).toBe("athome");
    expect(prefill.monthlyRentYen).toBe(100_000);
  });
});
