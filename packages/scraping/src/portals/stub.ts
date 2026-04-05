import type { PortalId } from "../core/types";
import type { ScrapeResult } from "../core/types";

/** Placeholder until Phase 3+ portal parsers are registered. */
export async function parseListingPageStub(
  portal: PortalId,
  _html: string,
  canonicalUrl: string,
): Promise<ScrapeResult> {
  return {
    status: "parse_failed",
    portal,
    canonicalUrl,
    message:
      "Listing page parser not implemented for this portal yet (add in Phase 3–5). HTML was fetched successfully.",
  };
}
