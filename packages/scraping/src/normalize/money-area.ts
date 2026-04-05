/**
 * Pure parsers for common Japanese rental listing text fragments.
 * Used by portal extractors and covered by unit tests (test-first).
 */

/** Convert 万円-style rent to monthly JPY integer (e.g. 12.5万 → 125000). */
export function parseMonthlyRentYenFromText(text: string): number | undefined {
  const normalized = text.replace(/\s/g, "");
  const man = normalized.match(/([\d.]+)\s*万(?:円)?/);
  if (man?.[1]) {
    const v = Number.parseFloat(man[1]);
    if (Number.isFinite(v)) {
      return Math.round(v * 10_000);
    }
  }
  const yen = normalized.match(/([\d,]+)\s*円/);
  if (yen?.[1]) {
    const digits = yen[1].replace(/,/g, "");
    const v = Number.parseInt(digits, 10);
    if (Number.isFinite(v) && v > 0) {
      return v;
    }
  }
  return undefined;
}

/** Parse area in ㎡ from a line (e.g. "専有面積 25.5㎡"). */
export function parseSquareMetersFromText(text: string): number | undefined {
  const m = text.replace(/\s/g, "").match(/([\d.]+)\s*㎡/);
  if (!m?.[1]) {
    return undefined;
  }
  const v = Number.parseFloat(m[1]);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

/** Parse 徒歩／歩 + minutes (e.g. "徒歩8分"). */
export function parseWalkingMinutesFromText(text: string): number | undefined {
  const m = text.match(/(?:徒歩|歩)\s*(\d+)\s*分/);
  if (!m?.[1]) {
    return undefined;
  }
  const v = Number.parseInt(m[1], 10);
  return Number.isFinite(v) && v >= 0 ? v : undefined;
}
