import type { ScrapingPreviewOutput } from "@tokyo-listings/validators/scraping";
import type { ListingCreateParityInput } from "@/components/listing/ListingFormParity";

export type PreviewStatus = "ok" | "partial" | null;

export type PreviewUiState = {
  prefill: Partial<ListingCreateParityInput> | undefined;
  warnings: string[];
  fieldErrors: Record<string, string>;
  status: PreviewStatus;
  mapPreviewAddress: string | null;
};

export function createPreviewSuccessState(
  res: Extract<ScrapingPreviewOutput, { status: "ok" | "partial" }>,
): PreviewUiState {
  const d = res.draft;
  const addr = d.addressText?.trim();
  return {
    prefill: {
      title: d.title ?? "",
      monthlyRentYen: d.monthlyRentYen,
      addressText: d.addressText ?? "",
      reikinMonths: d.reikinMonths,
      securityDepositMonths: d.securityDepositMonths,
      squareM: d.squareM,
      closestStation: d.closestStation ?? "",
      walkingTimeMin: d.walkingTimeMin,
      availability: d.availability,
      propertyType: d.propertyType,
      prefecture: d.prefecture ?? "",
      municipality: d.municipality ?? "",
      town: d.town ?? "",
      district: d.district ?? "",
      block: d.block ?? "",
      houseNumber: d.houseNumber ?? "",
    },
    warnings: res.status === "partial" ? d.warnings : [],
    fieldErrors: d.fieldErrors ?? {},
    status: res.status,
    mapPreviewAddress: addr && addr.length >= 4 ? addr : null,
  };
}

export function preservePreviewStateOnFailure(
  current: Pick<PreviewUiState, "prefill" | "warnings" | "fieldErrors" | "status" | "mapPreviewAddress">,
): Pick<PreviewUiState, "prefill" | "warnings" | "fieldErrors" | "status" | "mapPreviewAddress"> {
  return current;
}
