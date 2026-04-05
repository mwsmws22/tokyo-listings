/** Supported portal adapters (initial three + future expansion). */
export type PortalId = "athome" | "suumo" | "lifull_homes";

export type ScrapeStatus = "ok" | "partial" | "unsupported_host" | "fetch_failed" | "parse_failed";

/** Normalized fields aligned with listing create / property parity (all optional at draft stage). */
export type ScrapedListingDraft = {
  title?: string;
  monthlyRentYen?: number;
  /** When known from the portal (e.g. Athome 種目). */
  propertyType?: "一戸建て" | "アパート";
  /** 募集中 vs 契約済 when the portal page indicates it. */
  availability?: "募集中" | "契約済";
  addressText?: string;
  squareM?: number;
  closestStation?: string;
  walkingTimeMin?: number;
  reikinMonths?: number;
  securityDepositMonths?: number;
  prefecture?: string;
  municipality?: string;
  town?: string;
  district?: string;
  block?: string;
  houseNumber?: string;
  warnings: string[];
  fieldErrors?: Record<string, string>;
};

export type ScrapeResult =
  | {
      status: "ok";
      portal: PortalId;
      canonicalUrl: string;
      draft: ScrapedListingDraft;
    }
  | {
      status: "partial";
      portal: PortalId;
      canonicalUrl: string;
      draft: ScrapedListingDraft;
    }
  | {
      status: "unsupported_host";
      canonicalUrl: string;
      message: string;
    }
  | {
      status: "fetch_failed";
      canonicalUrl: string;
      message: string;
      code?: "timeout" | "too_large" | "http_error" | "invalid_url" | "network";
    }
  | {
      status: "parse_failed";
      portal: PortalId;
      canonicalUrl: string;
      message: string;
    };
