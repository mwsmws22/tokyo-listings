import { parseAthomeDetail } from "../portals/athome";
import { parseListingPageStub } from "../portals/stub";
import type { PortalId } from "./types";
import type { ScrapeResult } from "./types";

export function resolvePortalFromUrl(url: URL): PortalId | null {
  const host = url.hostname.toLowerCase();
  if (host === "www.athome.co.jp" || host === "athome.co.jp") {
    return "athome";
  }
  if (host === "www.suumo.jp" || host === "suumo.jp") {
    return "suumo";
  }
  if (host === "www.homes.co.jp" || host === "homes.co.jp") {
    return "lifull_homes";
  }
  return null;
}

/** Routes HTML to the portal-specific parser. */
export async function parseListingPage(
  portal: PortalId,
  html: string,
  canonicalUrl: string,
): Promise<ScrapeResult> {
  if (portal === "athome") {
    return parseAthomeDetail(html, canonicalUrl);
  }
  return parseListingPageStub(portal, html, canonicalUrl);
}
