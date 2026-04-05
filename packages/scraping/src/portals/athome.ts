import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { PortalId, ScrapeResult, ScrapedListingDraft } from "../core/types";
import { parseJapaneseAddressStructured } from "../normalize/address";
import { parseMonthlyRentYenFromText, parseSquareMetersFromText } from "../normalize/money-area";

const OVERVIEW_SEL = ".mainItemInfo.bukkenOverviewInfo";
const PAYMENTS_SEL = ".data.payments";

/** Markers aligned with ended / missing listings (incl. reference chintai URLs that no longer resolve to a live detail). */
const ATHOME_REMOVED_TEXT_MARKERS = [
  "お探しの物件は見つかりません",
  "掲載は終了しました",
  "この物件の掲載は終了",
  "掲載を終了",
  "掲載が終了",
] as const;

function normalizePageText(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  return noScript
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAthomeCaptchaPage(html: string): boolean {
  const t = normalizePageText(html);
  return (
    html.includes("認証にご協力") ||
    t.includes("認証にご協力") ||
    (html.includes("geetest") && html.includes("gt_")) ||
    t.includes("アクセスが集中しました")
  );
}

function isAthomeRemovedPage(html: string): boolean {
  const t = normalizePageText(html);
  return ATHOME_REMOVED_TEXT_MARKERS.some((m) => t.includes(m));
}

function normalizeAreaCellText(raw: string): string {
  return raw.replace(/\s/g, "").replace(/m²/g, "㎡");
}

/**
 * Parse 礼金/敷金 cell text into months. Legacy: 万円 amounts are converted using monthly rent in 万円.
 */
function parseDepositMonths(
  cellText: string,
  monthlyRentMan: number | undefined,
): number | undefined {
  const trimmed = cellText.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") {
    return undefined;
  }
  if (trimmed === "なし") {
    return 0;
  }
  const noUnitMonth = trimmed.replace(/ヶ月|ヵ月/g, "").trim();
  if (noUnitMonth === "なし") {
    return 0;
  }
  if (monthlyRentMan && monthlyRentMan > 0 && trimmed.includes("万円")) {
    const manMatch = trimmed.match(/([\d.]+)\s*万/);
    if (manMatch?.[1]) {
      const man = Number.parseFloat(manMatch[1]);
      if (Number.isFinite(man)) {
        const months = man / monthlyRentMan;
        return Math.round(months * 10) / 10;
      }
    }
  }
  const digit = trimmed.match(/([\d.]+)/);
  if (digit?.[1]) {
    const v = Number.parseFloat(digit[1]);
    return Number.isFinite(v) ? v : undefined;
  }
  return undefined;
}

function propertyTypeFromShumoku(raw: string): "一戸建て" | "アパート" | undefined {
  const t = raw.replace(/\s/g, "");
  if (!t) {
    return undefined;
  }
  if (/一戸建て|タウンハウス|テラス/.test(t)) {
    return "一戸建て";
  }
  if (/マンション|アパート|コーポ|ハイツ|テラスハウス/.test(t)) {
    return "アパート";
  }
  return undefined;
}

function pickBestStationWalk(
  $: CheerioAPI,
  overview: Cheerio<AnyNode>,
): { station?: string; walkMin?: number } {
  const paras = $("th:contains(交通) + td p", overview);
  let bestStation: string | undefined;
  let bestWalk: number | undefined;

  paras.each((_, el) => {
    const text = $(el).text();
    if (text.includes("バス")) {
      return;
    }
    const stationM = text.match(/\s\/\s(.*?)駅/);
    const walkM = text.match(/徒歩\s*(\d+)\s*分/);
    if (!stationM?.[1] || !walkM?.[1]) {
      return;
    }
    const station = `${stationM[1]}駅`;
    const walk = Number.parseInt(walkM[1], 10);
    if (!Number.isFinite(walk)) {
      return;
    }
    if (bestWalk === undefined || walk < bestWalk) {
      bestWalk = walk;
      bestStation = station;
    }
  });

  return { station: bestStation, walkMin: bestWalk };
}

function looksLikeAthomeDetail(html: string): boolean {
  return (
    html.includes("bukkenOverviewInfo") ||
    html.includes("data payments") ||
    html.includes("data.payments")
  );
}

/** Cheerio extraction plus async `jp-address-parser` enrichment. */
export async function parseAthomeDetail(html: string, canonicalUrl: string): Promise<ScrapeResult> {
  const portal: PortalId = "athome";
  if (!html || html.length < 80) {
    return {
      status: "parse_failed",
      portal,
      canonicalUrl,
      message: "ページの内容が空か短すぎて判別できませんでした。",
    };
  }

  if (isAthomeCaptchaPage(html)) {
    return {
      status: "parse_failed",
      portal,
      canonicalUrl,
      message: "アットホームがアクセス制限ページを返しました。しばらくしてから再試行してください。",
    };
  }

  if (isAthomeRemovedPage(html)) {
    const draft: ScrapedListingDraft = {
      availability: "契約済",
      warnings: ["LISTING_REMOVED_OR_ENDED"],
    };
    return {
      status: "partial",
      portal,
      canonicalUrl,
      draft,
    };
  }

  if (!looksLikeAthomeDetail(html)) {
    return {
      status: "parse_failed",
      portal,
      canonicalUrl,
      message: "ページの形がアットホームの物件詳細として認識できませんでした。",
    };
  }

  const $ = cheerio.load(html);
  const overview = $(OVERVIEW_SEL).first();
  const paymentsBlock = $(PAYMENTS_SEL).first();
  const rentSource =
    paymentsBlock.length > 0 ? paymentsBlock.text() : $(".num", PAYMENTS_SEL).parent().text();

  if (overview.length === 0 && !paymentsBlock.length && !$(".num", PAYMENTS_SEL).length) {
    return {
      status: "parse_failed",
      portal,
      canonicalUrl,
      message: "ページの形がアットホームの物件詳細として認識できませんでした。",
    };
  }

  const monthlyRentYen = parseMonthlyRentYenFromText(rentSource);
  let monthlyRentMan: number | undefined;
  if (monthlyRentYen) {
    monthlyRentMan = monthlyRentYen / 10_000;
  }

  const areaRaw = $('th:contains("面積") + td', overview).text();
  const squareM = parseSquareMetersFromText(normalizeAreaCellText(areaRaw));

  const shumokuRaw = $('th:contains("種目") + td', overview).text();
  const propertyType = propertyTypeFromShumoku(shumokuRaw);

  const reikinText = $('th:contains("礼金") + td', overview).text();
  const shikiText = $('th:contains("敷金") + td', overview).text();
  const reikinMonths = parseDepositMonths(reikinText, monthlyRentMan);
  const securityDepositMonths = parseDepositMonths(shikiText, monthlyRentMan);

  let addressText = $(".text-with-button", overview).first().text().trim();
  if (!addressText) {
    addressText = $(".text-with-button", overview).text().trim();
  }

  const { station: closestStation, walkMin: walkingTimeMin } = pickBestStationWalk($, overview);

  const titleRaw = $("title").first().text().trim();
  const title = titleRaw ? titleRaw.split(/[|｜]/)[0]?.trim() : undefined;

  const warnings: string[] = [];
  if (monthlyRentYen === undefined) {
    warnings.push("RENT_NOT_FOUND");
  }
  if (!addressText) {
    warnings.push("ADDRESS_NOT_FOUND");
  }
  if (squareM === undefined) {
    warnings.push("AREA_NOT_FOUND");
  }
  if (!closestStation || walkingTimeMin === undefined) {
    warnings.push("STATION_NOT_FOUND");
  }
  if (propertyType === undefined) {
    warnings.push("PROPERTY_TYPE_NOT_FOUND");
  }

  const addrFields = addressText ? await parseJapaneseAddressStructured(addressText) : {};

  const draft: ScrapedListingDraft = {
    title: title || undefined,
    monthlyRentYen,
    propertyType,
    availability: "募集中",
    addressText: addressText || undefined,
    squareM,
    closestStation,
    walkingTimeMin,
    reikinMonths,
    securityDepositMonths,
    prefecture: addrFields.prefecture,
    municipality: addrFields.municipality,
    town: addrFields.town,
    district: addrFields.district,
    block: addrFields.block,
    houseNumber: addrFields.houseNumber,
    warnings,
  };

  if (monthlyRentYen === undefined && !addressText && squareM === undefined) {
    return {
      status: "parse_failed",
      portal,
      canonicalUrl,
      message: "賃料・住所・面積を読み取れませんでした。",
    };
  }

  const status =
    monthlyRentYen !== undefined && addressText && squareM !== undefined ? "ok" : "partial";

  return {
    status,
    portal,
    canonicalUrl,
    draft,
  };
}
