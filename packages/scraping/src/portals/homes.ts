import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { PortalId, ScrapeResult, ScrapedListingDraft } from "../core/types";
import { parseJapaneseAddressStructured } from "../normalize/address";
import { parseMonthlyRentYenFromText, parseSquareMetersFromText } from "../normalize/money-area";

const PORTAL: PortalId = "lifull_homes";

/** Map full-width digits (common on Japanese sites) to ASCII for minute parsing. */
function normalizeFullWidthDigits(s: string): string {
  return s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
}

function parseShikireiMonths(
  leftPart: string,
  rightPart: string,
  monthlyRentYen: number | undefined,
): { securityDepositMonths?: number; reikinMonths?: number } {
  const parseSide = (side: string): number | undefined => {
    const t = side.replace(/\s/g, "").trim();
    if (!t || t === "-" || t === "—") {
      return 0;
    }
    if (t === "なし" || t === "無") {
      return 0;
    }
    if (t.includes("ヶ月") || t.includes("ヵ月")) {
      const n = t.replace(/ヶ月|ヵ月/g, "").match(/([\d.]+)/);
      if (n?.[1]) {
        const v = Number.parseFloat(n[1]);
        return Number.isFinite(v) ? v : undefined;
      }
    }
    if (t.includes("万円") && monthlyRentYen && monthlyRentYen > 0) {
      const manMatch = t.match(/([\d.]+)\s*万/);
      if (manMatch?.[1]) {
        const man = Number.parseFloat(manMatch[1]);
        if (Number.isFinite(man)) {
          const rentMan = monthlyRentYen / 10_000;
          const months = man / rentMan;
          return Math.round(months * 10) / 10;
        }
      }
    }
    return undefined;
  };

  return {
    securityDepositMonths: parseSide(leftPart),
    reikinMonths: parseSide(rightPart),
  };
}

function splitShikireiLine(line: string): { left: string; right: string } | null {
  const idx = line.indexOf("/");
  if (idx < 0) {
    return null;
  }
  return {
    left: line.slice(0, idx).trim(),
    right: line.slice(idx + 1).trim(),
  };
}

/**
 * One line of 交通: "…線 …駅 徒歩N分" or "…線/…駅 歩N分".
 * Requires `線` (rail line) to ignore バス-only rows. Picks the last `…駅` token before 徒歩/歩 (station name).
 */
function parseStationWalkLine(text: string): { station: string; walkMin: number } | null {
  const t = normalizeFullWidthDigits(text.replace(/\s+/g, " ").trim());
  if (!t || /他に|通勤|\bkm\b/i.test(t)) {
    return null;
  }
  if (!t.includes("線")) {
    return null;
  }
  if (/^バス\s|バス\d|バス停|^\s*バス$/i.test(t)) {
    return null;
  }
  const m = t.match(/(\S+駅)\s*(?:徒歩|歩)\s*(\d+)\s*分/);
  if (!m?.[1] || !m?.[2]) {
    return null;
  }
  const station = m[1].trim();
  const walkMin = Number.parseInt(m[2], 10);
  if (!Number.isFinite(walkMin)) {
    return null;
  }
  return { station, walkMin };
}

/** Split a 交通 block into physical lines (newline or &lt;br&gt;). */
function splitTrafficElementToLines($: CheerioAPI, el: AnyNode): string[] {
  const rawHtml = $(el).html();
  if (rawHtml === null || rawHtml === undefined || rawHtml.trim() === "") {
    const t = $(el)
      .text()
      .replace(/\u00a0/g, " ");
    return t
      .split(/\n+/)
      .map((l) => normalizeFullWidthDigits(l.replace(/\s+/g, " ").trim()))
      .filter(Boolean);
  }
  const withBreaks = rawHtml.replace(/<br\s*\/?>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  return stripped
    .split(/\n+/)
    .map((l) => normalizeFullWidthDigits(l.replace(/\s+/g, " ").trim()))
    .filter(Boolean);
}

function collectHomesTrafficLines($: CheerioAPI): string[] {
  const lines: string[] = [];
  const trafficDd = $("dt")
    .filter((_, el) => $(el).text().trim() === "交通")
    .first()
    .next("dd");

  if (trafficDd.length > 0) {
    const paras = trafficDd.find("p");
    if (paras.length > 0) {
      paras.each((_, el) => {
        lines.push(...splitTrafficElementToLines($, el));
      });
    } else {
      const n = trafficDd.get(0);
      if (n) {
        lines.push(...splitTrafficElementToLines($, n));
      }
    }
  }

  if (lines.length === 0) {
    $("#chk-bkc-fulltraffic p").each((_, el) => {
      lines.push(...splitTrafficElementToLines($, el));
    });
  }

  return lines;
}

function pickBestHomesStation($: CheerioAPI): { station?: string; walkMin?: number } {
  const lineTexts = collectHomesTrafficLines($);

  let bestStation: string | undefined;
  let bestWalk: number | undefined;

  for (const line of lineTexts) {
    const parsed = parseStationWalkLine(line);
    if (!parsed) {
      continue;
    }
    if (bestWalk === undefined || parsed.walkMin < bestWalk) {
      bestWalk = parsed.walkMin;
      bestStation = parsed.station;
    }
  }

  return { station: bestStation, walkMin: bestWalk };
}

function ddTextAfterDt($: CheerioAPI, label: string): string {
  const dt = $("dt")
    .filter((_, el) => $(el).text().trim() === label)
    .first();
  if (!dt.length) {
    return "";
  }
  return dt.next("dd").first().text().replace(/\s+/g, " ").trim();
}

function propertyTypeFromHomes(raw: string): "一戸建て" | "アパート" | undefined {
  const t = raw.replace(/^賃貸\s*/, "").replace(/\s/g, "");
  if (!t) {
    return undefined;
  }
  if (t === "マンション") {
    return "アパート";
  }
  if (t === "テラスハウス") {
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

function propertyTypeBadgeFromNewTemplate($: CheerioAPI, html: string): string {
  const fromDom = $("main span.rounded-full")
    .filter((_, el) => /^賃貸/.test($(el).text().trim()))
    .first()
    .text()
    .trim();
  if (fromDom) {
    return fromDom;
  }
  const m = html.match(/rounded-full[^>]*>(賃貸[^<]{2,40})<\/span>\s*<h1/i);
  return m?.[1]?.trim() ?? "";
}

/**
 * Legacy template used `#chk-bkc-*` ids. Current (2024+) chintai room pages use a `<dl>` of dt/dd rows.
 * Detection stays loose: markup varies (minified tags, A/B copy), but room URLs are stable in canonical/og:url.
 */
function looksLikeHomesDetail(html: string): boolean {
  if (
    html.includes("chk-bkc-moneyroom") ||
    html.includes("chk-bkc-fulladdress") ||
    html.includes("chk-bkc-housearea")
  ) {
    return true;
  }

  const onHomes = /homes\.co\.jp/i.test(html);

  // Typical chintai room detail URL embedded in HTML (canonical, og:url, JSON, etc.)
  if (/homes\.co\.jp\/chintai\/room\/[a-f0-9]{20,}/i.test(html)) {
    return true;
  }

  // New dl layout: labels may sit in `<dt>` with classes (still contain these substrings in the raw response).
  if (onHomes && html.includes("所在地") && html.includes("専有面積")) {
    return true;
  }

  if (
    html.includes("/chintai/room/") &&
    (html.includes("LIFULL HOME") ||
      html.includes("ライフルホームズ") ||
      html.includes("product_room"))
  ) {
    return true;
  }
  return false;
}

function usesNewDlTemplate($: CheerioAPI): boolean {
  return (
    $("#chk-bkc-moneyroom").length === 0 &&
    $("dt").filter((_, el) => $(el).text().trim() === "所在地").length > 0
  );
}

export async function parseLifullHomesDetail(
  html: string,
  canonicalUrl: string,
): Promise<ScrapeResult> {
  if (!html || html.length < 80) {
    return {
      status: "parse_failed",
      portal: PORTAL,
      canonicalUrl,
      message: "ページの内容が空か短すぎて判別できませんでした。",
    };
  }

  if (!looksLikeHomesDetail(html)) {
    return {
      status: "parse_failed",
      portal: PORTAL,
      canonicalUrl,
      message: "ページの形がLIFULL HOME'Sの物件詳細として認識できませんでした。",
    };
  }

  const $ = cheerio.load(html);
  const newDl = usesNewDlTemplate($);

  let monthlyRentYen: number | undefined;
  let squareM: number | undefined;
  let securityDepositMonths: number | undefined;
  let reikinMonths: number | undefined;
  let addressText: string;
  let typeRaw: string;

  if (newDl) {
    const rentLine = ddTextAfterDt($, "賃料");
    monthlyRentYen = parseMonthlyRentYenFromText(rentLine);

    const areaLine = ddTextAfterDt($, "専有面積");
    squareM = parseSquareMetersFromText(areaLine.replace(/\s/g, "").replace(/m²/g, "㎡"));

    let shikireiLine = ddTextAfterDt($, "敷金/礼金");
    if (!shikireiLine) {
      shikireiLine = ddTextAfterDt($, "敷金・礼金");
    }
    const shikireiParts = splitShikireiLine(shikireiLine);
    const shikireiParsed = shikireiParts
      ? parseShikireiMonths(shikireiParts.left, shikireiParts.right, monthlyRentYen)
      : {};
    securityDepositMonths = shikireiParsed.securityDepositMonths;
    reikinMonths = shikireiParsed.reikinMonths;

    const addrDd = $("dt")
      .filter((_, el) => $(el).text().trim() === "所在地")
      .first()
      .next("dd")
      .first();
    addressText =
      addrDd
        .find("p")
        .first()
        .text()
        .replace(/[\s|\n]/gm, "")
        .trim() ||
      addrDd
        .text()
        .replace(/[\s|\n]/gm, "")
        .trim();

    typeRaw = propertyTypeBadgeFromNewTemplate($, html);
  } else {
    const rentSource = $("#chk-bkc-moneyroom").first().text();
    monthlyRentYen = parseMonthlyRentYenFromText(rentSource);

    const areaRaw = $("#chk-bkc-housearea").first().text();
    squareM = parseSquareMetersFromText(areaRaw.replace(/\s/g, "").replace(/m²/g, "㎡"));

    const shikireiLine = $("#chk-bkc-moneyshikirei").first().text().replace(/\r/g, "\n");
    const parts = splitShikireiLine(shikireiLine);
    const parsed = parts ? parseShikireiMonths(parts.left, parts.right, monthlyRentYen) : {};
    securityDepositMonths = parsed.securityDepositMonths;
    reikinMonths = parsed.reikinMonths;

    const addressEl = $("#chk-bkc-fulladdress").first();
    addressText =
      addressEl
        .contents()
        .first()
        .text()
        .replace(/[\s|\n]/gm, "")
        .trim() ||
      addressEl
        .text()
        .replace(/[\s|\n]/gm, "")
        .trim();

    typeRaw = $("#chk-bkh-type").first().text();
  }

  const { station: closestStation, walkMin: walkingTimeMin } = pickBestHomesStation($);

  const propertyType = propertyTypeFromHomes(typeRaw);

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
