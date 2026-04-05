import type { PortalId, ScrapedListingDraft } from "@tokyo-listings/scraping";
import type { listingCreateSchema } from "@tokyo-listings/validators/listing";
import type { z } from "zod";

type ListingCreate = z.infer<typeof listingCreateSchema>;

/**
 * Maps a successful scrape draft into fields compatible with `listing.create` (partial).
 * Omits required create fields when missing from the draft — the UI must still collect them.
 */
export function mapScrapeDraftToListingPrefill(
  draft: ScrapedListingDraft,
  canonicalUrl: string,
  portal: PortalId,
): Partial<ListingCreate> {
  const out: Partial<ListingCreate> = {
    sourceUrl: canonicalUrl,
    sourcePortal: portal,
  };
  if (draft.title !== undefined) {
    out.title = draft.title;
  }
  if (draft.monthlyRentYen !== undefined) {
    out.monthlyRentYen = draft.monthlyRentYen;
  }
  if (draft.propertyType !== undefined) {
    out.propertyType = draft.propertyType;
  }
  if (draft.availability !== undefined) {
    out.availability = draft.availability;
  }
  if (draft.addressText !== undefined) {
    out.addressText = draft.addressText;
  }
  if (draft.reikinMonths !== undefined) {
    out.reikinMonths = draft.reikinMonths;
  }
  if (draft.securityDepositMonths !== undefined) {
    out.securityDepositMonths = draft.securityDepositMonths;
  }
  if (draft.squareM !== undefined) {
    out.squareM = draft.squareM;
  }
  if (draft.closestStation !== undefined) {
    out.closestStation = draft.closestStation;
  }
  if (draft.walkingTimeMin !== undefined) {
    out.walkingTimeMin = draft.walkingTimeMin;
  }
  if (draft.prefecture !== undefined) {
    out.prefecture = draft.prefecture;
  }
  if (draft.municipality !== undefined) {
    out.municipality = draft.municipality;
  }
  if (draft.town !== undefined) {
    out.town = draft.town;
  }
  if (draft.district !== undefined) {
    out.district = draft.district;
  }
  if (draft.block !== undefined) {
    out.block = draft.block;
  }
  if (draft.houseNumber !== undefined) {
    out.houseNumber = draft.houseNumber;
  }
  return out;
}
