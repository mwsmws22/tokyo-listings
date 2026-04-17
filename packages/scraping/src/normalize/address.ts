import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const japa = require("jp-address-parser") as {
  parse: (address: string) => Promise<Record<string, unknown>>;
};

export type ParsedAddressFields = {
  prefecture?: string;
  municipality?: string;
  town?: string;
  district?: number;
  block?: number;
  houseNumber?: number;
};

const KANTO_PREFECTURES = ["東京都", "埼玉県", "神奈川県", "千葉県", "静岡県"];

function mapResult(res: Record<string, unknown>): ParsedAddressFields {
  const out: ParsedAddressFields = {};
  if (typeof res.prefecture === "string") {
    out.prefecture = res.prefecture;
  }
  if (typeof res.city === "string") {
    out.municipality = res.city;
  }
  if (typeof res.town === "string") {
    out.town = res.town;
  }
  if (typeof res.chome === "string") out.district = parseAddressNumber(res.chome);
  if (typeof res.ban === "string") out.block = parseAddressNumber(res.ban);
  if (typeof res.go === "string") out.houseNumber = parseAddressNumber(res.go);
  const left = res.left;
  if ((out.block == null || out.houseNumber == null) && typeof left === "string") {
    const parsed = parseBlockAndHouseFromTail(left);
    if (out.block == null) out.block = parsed.block;
    if (out.houseNumber == null) out.houseNumber = parsed.houseNumber;
  }
  if (!out.houseNumber && typeof left === "string") {
    out.houseNumber = parseTrailingAddressNumber(left);
  }
  return out;
}

function toAsciiDigits(input: string): string {
  return input.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
}

function parseAddressNumber(raw: string): number | undefined {
  const normalized = toAsciiDigits(raw).replace(/[丁目番号]/g, "").trim();
  const match = normalized.match(/\d+/);
  if (!match) return undefined;
  const n = Number.parseInt(match[0], 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseTrailingAddressNumber(raw: string): number | undefined {
  const normalized = toAsciiDigits(raw).replace(/[‐‑‒–—―ー－]/g, "-");
  const matches = normalized.match(/\d+/g);
  if (!matches || matches.length === 0) return undefined;
  const n = Number.parseInt(matches[matches.length - 1] ?? "", 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseBlockAndHouseFromTail(raw: string): { block?: number; houseNumber?: number } {
  const normalized = toAsciiDigits(raw).replace(/[‐‑‒–—―ー－]/g, "-");
  const match = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return {};
  const block = Number.parseInt(match[1] ?? "", 10);
  const houseNumber = Number.parseInt(match[2] ?? "", 10);
  return {
    block: Number.isFinite(block) ? block : undefined,
    houseNumber: Number.isFinite(houseNumber) ? houseNumber : undefined,
  };
}

/**
 * Split a Japanese address string into structured fields (legacy Utils.parseAddress semantics).
 */
export async function parseJapaneseAddressStructured(
  address: string,
): Promise<ParsedAddressFields> {
  const trimmed = address.trim();
  if (!trimmed) {
    return {};
  }

  try {
    if (KANTO_PREFECTURES.some((p) => trimmed.startsWith(p))) {
      const res = await japa.parse(trimmed);
      return mapResult(res);
    }
    let last: unknown;
    for (const p of KANTO_PREFECTURES) {
      try {
        const res = await japa.parse(p + trimmed);
        return mapResult(res);
      } catch (e) {
        last = e;
      }
    }
    if (last) {
      throw last;
    }
    return {};
  } catch {
    return {};
  }
}
