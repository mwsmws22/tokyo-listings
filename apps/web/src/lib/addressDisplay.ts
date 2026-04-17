export function toFullWidthDigits(input: string): string {
  return input.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x30 + 0xff10));
}

export function toFullWidthDash(input: string): string {
  return input.replace(/-/g, "－");
}

export function formatFreeformAddressForDisplay(input: string | null | undefined): string {
  if (!input) return "—";
  return toFullWidthDash(toFullWidthDigits(input));
}

export function formatAddressNumberPart(value: number | null | undefined, suffix: string): string {
  if (value == null || !Number.isFinite(value)) return "";
  return `${toFullWidthDigits(String(value))}${suffix}`;
}

export function formatAddressPartsForDisplay(parts: {
  prefecture?: string | null;
  municipality?: string | null;
  town?: string | null;
  district?: number | null;
  block?: number | null;
  houseNumber?: number | null;
}): string {
  const head = [parts.prefecture, parts.municipality, parts.town]
    .map((x) => x?.trim() ?? "")
    .filter(Boolean)
    .join("");
  const district = formatAddressNumberPart(parts.district, "丁目");
  const block = parts.block != null && Number.isFinite(parts.block) ? toFullWidthDigits(String(parts.block)) : "";
  const house =
    parts.houseNumber != null && Number.isFinite(parts.houseNumber)
      ? toFullWidthDigits(String(parts.houseNumber))
      : "";
  let tail = district;
  if (block && house) {
    tail += `${block}－${house}`;
  } else if (block) {
    tail += block;
  } else if (house) {
    tail += house;
  }
  return `${head}${tail}` || "—";
}

