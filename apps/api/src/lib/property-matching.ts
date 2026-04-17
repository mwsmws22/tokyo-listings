/**
 * Property / address matching for “similar property” suggestions.
 *
 * Legacy reference: `tokyo-listings-old/tokyo-listings-server` used `Utils.parseAddress` for scraping;
 * duplicate-property UX in this codebase is new. Matching here is **structured-field equality**
 * after Unicode + whitespace normalization (NFKC, trim, full-width digit folding). Intentional:
 * we persist prefecture…houseNumber on `property` and match the same shape as the add form.
 */

export type AddressParts = {
  prefecture?: string | null;
  municipality?: string | null;
  town?: string | null;
  district?: number | null;
  block?: number | null;
  houseNumber?: number | null;
};

/** Normalize one address component for comparison. */
export function normalizeAddressPart(value: string | number | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  let s = value
    .normalize("NFKC")
    .trim()
    .replace(/\u3000/g, " ");
  // Full-width ASCII digits → half-width (legacy pages often use １２３)
  s = s.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  return s.replace(/\s+/g, " ");
}

export function addressPartsKey(parts: AddressParts): string {
  return [
    normalizeAddressPart(parts.prefecture),
    normalizeAddressPart(parts.municipality),
    normalizeAddressPart(parts.town),
    normalizeAddressPart(parts.district),
    normalizeAddressPart(parts.block),
    normalizeAddressPart(parts.houseNumber),
  ].join("|");
}

export function addressesStructurallyEqual(a: AddressParts, b: AddressParts): boolean {
  return addressPartsKey(a) === addressPartsKey(b);
}

function equalIfDraftProvided(
  draftValue: string | number | null | undefined,
  candidateValue: string | number | null | undefined,
): boolean {
  const d = normalizeAddressPart(draftValue);
  if (!d) return true;
  return d === normalizeAddressPart(candidateValue);
}

function matchesExactByProvidedParts(draft: AddressParts, candidate: AddressParts): boolean {
  return (
    equalIfDraftProvided(draft.prefecture, candidate.prefecture) &&
    equalIfDraftProvided(draft.municipality, candidate.municipality) &&
    equalIfDraftProvided(draft.town, candidate.town) &&
    equalIfDraftProvided(draft.district, candidate.district) &&
    equalIfDraftProvided(draft.block, candidate.block) &&
    equalIfDraftProvided(draft.houseNumber, candidate.houseNumber)
  );
}

function matchesLooseAreaOnly(draft: AddressParts, candidate: AddressParts): boolean {
  const pref = normalizeAddressPart(draft.prefecture);
  const muni = normalizeAddressPart(draft.municipality);
  const town = normalizeAddressPart(draft.town);
  if (!pref || !muni || !town) return false;
  return (
    pref === normalizeAddressPart(candidate.prefecture) &&
    muni === normalizeAddressPart(candidate.municipality) &&
    town === normalizeAddressPart(candidate.town)
  );
}

/** True if we have enough structured address to run a DB match (not all empty). */
export function hasMinimumAddressForMatch(parts: AddressParts): boolean {
  const k = addressPartsKey(parts);
  return k.replace(/\|/g, "").length >= 2;
}

/**
 * Round to 2 decimals (half-up), same as typical ㎡ display.
 * Used for comparing draft `squareM` to per-property average listing area.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type PropertyRowShape = AddressParts & {
  id: string;
  propertyType: "一戸建て" | "アパート" | null;
  interest: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah" | null;
  label: string | null;
};

export type SimilarPropertyCandidate = {
  propertyId: string;
  prefecture: string | null;
  municipality: string | null;
  town: string | null;
  district: number | null;
  block: number | null;
  houseNumber: number | null;
  propertyType: "一戸建て" | "アパート" | null;
  interest: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah" | null;
  label: string | null;
  averageSquareM: number | null;
  listingCount: number;
  /** Absolute diff vs draft `squareM` when both are known (ranking key). */
  areaDiffAbs: number | null;
};

/**
 * Address-matched properties only; ranked by smallest `areaDiffAbs` when draft `squareM` is set,
 * otherwise by listing count (desc) then id.
 */
export function buildSimilarPropertyCandidates(
  input: AddressParts & { squareM?: number },
  properties: PropertyRowShape[],
  squareMetersByPropertyId: Map<string, number[]>,
): SimilarPropertyCandidate[] {
  const draft = { ...input };
  const exactMatches = properties.filter((p) => matchesExactByProvidedParts(draft, p));
  const matched =
    exactMatches.length > 0 ? exactMatches : properties.filter((p) => matchesLooseAreaOnly(draft, p));

  const out: SimilarPropertyCandidate[] = matched.map((p) => {
    const areas = squareMetersByPropertyId.get(p.id) ?? [];
    const listingCount = areas.length;
    const averageSquareM =
      areas.length > 0 ? round2(areas.reduce((a, b) => a + b, 0) / areas.length) : null;
    let areaDiffAbs: number | null = null;
    if (draft.squareM !== undefined && averageSquareM !== null) {
      areaDiffAbs = Math.abs(round2(draft.squareM) - averageSquareM);
    }
    return {
      propertyId: p.id,
      prefecture: p.prefecture ?? null,
      municipality: p.municipality ?? null,
      town: p.town ?? null,
      district: p.district ?? null,
      block: p.block ?? null,
      houseNumber: p.houseNumber ?? null,
      propertyType: p.propertyType ?? null,
      interest: p.interest ?? null,
      label: p.label ?? null,
      averageSquareM,
      listingCount,
      areaDiffAbs,
    };
  });

  const hasDraftArea = draft.squareM !== undefined && Number.isFinite(draft.squareM);
  out.sort((a, b) => {
    if (hasDraftArea) {
      const ad = a.areaDiffAbs;
      const bd = b.areaDiffAbs;
      if (ad != null && bd != null && ad !== bd) return ad - bd;
      if (ad != null && bd == null) return -1;
      if (ad == null && bd != null) return 1;
    }
    if (b.listingCount !== a.listingCount) return b.listingCount - a.listingCount;
    return a.propertyId.localeCompare(b.propertyId);
  });

  return out;
}
