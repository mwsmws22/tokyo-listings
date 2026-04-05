import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { PortalId, ScrapeResult, ScrapedListingDraft } from "../core/types";
import { parseJapaneseAddressStructured } from "../normalize/address";
import { parseMonthlyRentYenFromText, parseSquareMetersFromText } from "../normalize/money-area";

const PORTAL: PortalId = "suumo";

function normalizeAreaCell(raw: string): string {
  return raw.replace(/\s/g, "").replace(/m2/gi, "㎡");
}

function monthsFromDepositLine(
  labelRemoved: string,
  monthlyRentYen: number | undefined,
): number | undefined {
  const t = labelRemoved.replace(/\s/g, "").replace(/[：:]/g, "").trim();
  if (!t || t === "-" || t === "—") {
    return 0;
  }
  if (t === "なし") {
    return 0;
  }
  if (t.includes("万円") && monthlyRentYen && monthlyRentYen > 0) {
    const manMatch = t.match(/([\d.]+)\s*万/);
    if (manMatch?.[1]) {
      const depositMan = Number.parseFloat(manMatch[1]);
      if (Number.isFinite(depositMan)) {
        const rentMan = monthlyRentYen / 10_000;
        const months = depositMan / rentMan;
        return Math.round(months * 10) / 10;
      }
    }
  }
  const digit = t.match(/([\d.]+)/);
  if (digit?.[1]) {
    const v = Number.parseFloat(digit[1]);
    return Number.isFinite(v) ? v : undefined;
  }
  return undefined;
}

function propertyTypeFromSuumo(raw: string): "一戸建て" | "アパート" | undefined {
  const t = raw.replace(/\s/g, "");
  if (!t) {
    return undefined;
  }
  if (t === "マンション") {
    return "アパート";
  }
  if (t === "テラス・タウンハウス") {
    return "一戸建て";
  }
  if (/一戸建て|タウンハウス|テラス/.test(t)) {
    return "一戸建て";
  }
  if (/マンション|アパート|コーポ|ハイツ|テラスハウス/.test(t)) {
    return "アパート";
  }
  return undefined;
}

function pickBestStationWalk($: CheerioAPI): { station?: string; walkMin?: number } {
  const cell = $('th:contains("駅徒歩") + td').first();
  const rows = cell.find(".property_view_table-read");
  let bestStation: string | undefined;
  let bestWalk: number | undefined;

  rows.each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!text || /バス|車/i.test(text)) {
      return;
    }
    const stationM = text.match(/\/\s*(.+?駅)/i);
    const walkM = text.match(/歩\s*(\d+)\s*分/i);
    if (!stationM?.[1] || !walkM?.[1]) {
      return;
    }
    const station = stationM[1].replace(/\s/g, "").endsWith("駅")
      ? stationM[1].replace(/\s/g, "")
      : `${stationM[1].replace(/\s/g, "")}駅`;
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

function isSuumoChintaiDetail(canonicalHref: string | undefined): boolean {
  if (!canonicalHref) {
    return false;
  }
  try {
    const path = new URL(canonicalHref, "https://suumo.jp").pathname;
    return path.includes("chintai/jnc_");
  } catch {
    return canonicalHref.includes("chintai/jnc_");
  }
}

export async function parseSuumoDetail(html: string, canonicalUrl: string): Promise<ScrapeResult> {
  if (!html || html.length < 80) {
    return {
      status: "parse_failed",
      portal: PORTAL,
      canonicalUrl,
      message: "ページの内容が空か短すぎて判別できませんでした。",
    };
  }

  const $ = cheerio.load(html);
  const canonicalHref = $('link[rel="canonical"]').attr("href");
  if (!isSuumoChintaiDetail(canonicalHref)) {
    return {
      status: "parse_failed",
      portal: PORTAL,
      canonicalUrl,
      message: "SUUMOの賃貸物件詳細ページではないか、掲載が終了しています。",
    };
  }

  const rentSource = $(".property_view_note-emphasis").first().text();
  const monthlyRentYen = parseMonthlyRentYenFromText(rentSource);

  const listRoot = $(".property_view_note-list").first();
  const reikinLine = listRoot.find('span:contains("礼金")').first().text();
  const shikiLine = listRoot.find('span:contains("敷金")').first().text();
  const reikinMonths = monthsFromDepositLine(
    reikinLine.replace(/礼金/g, "").trim(),
    monthlyRentYen,
  );
  const securityDepositMonths = monthsFromDepositLine(
    shikiLine.replace(/敷金/g, "").trim(),
    monthlyRentYen,
  );

  const areaRaw = $('th:contains("専有面積") + td').first().text();
  const squareM = parseSquareMetersFromText(normalizeAreaCell(areaRaw));

  const addressText = $('th:contains("所在地") + td').first().text().trim();

  const { station: closestStation, walkMin: walkingTimeMin } = pickBestStationWalk($);

  const propertyTypeRaw = $('th:contains("建物種別") + td').first().text();
  const propertyType = propertyTypeFromSuumo(propertyTypeRaw);

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
      portal: PORTAL,
      canonicalUrl,
      message: "賃料・住所・面積を読み取れませんでした。",
    };
  }

  const status =
    monthlyRentYen !== undefined && addressText && squareM !== undefined ? "ok" : "partial";

  return {
    status,
    portal: PORTAL,
    canonicalUrl,
    draft,
  };
}
