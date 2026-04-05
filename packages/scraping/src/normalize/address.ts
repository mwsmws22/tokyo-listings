import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const japa = require("jp-address-parser") as {
  parse: (address: string) => Promise<Record<string, unknown>>;
};

export type ParsedAddressFields = {
  prefecture?: string;
  municipality?: string;
  town?: string;
  district?: string;
  block?: string;
  houseNumber?: string;
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
  if (typeof res.chome === "string") {
    out.district = res.chome;
  }
  if (typeof res.ban === "string") {
    out.block = res.ban;
  }
  if (typeof res.go === "string") {
    out.houseNumber = res.go;
  }
  const left = res.left;
  if (!out.houseNumber && typeof left === "string" && left.startsWith("‐")) {
    const n = Number.parseInt(left.replace("‐", ""), 10);
    if (Number.isFinite(n)) {
      out.houseNumber = String(n);
    }
  }
  return out;
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
