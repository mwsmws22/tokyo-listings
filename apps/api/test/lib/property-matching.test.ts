import { describe, expect, test } from "vitest";
import {
  addressesStructurallyEqual,
  buildSimilarPropertyCandidates,
  hasMinimumAddressForMatch,
  normalizeAddressPart,
  round2,
} from "../../src/lib/property-matching";

describe("property-matching", () => {
  test("normalizeAddressPart folds full-width digits and NFKC", () => {
    expect(normalizeAddressPart("１丁目２番")).toBe("1丁目2番");
    expect(normalizeAddressPart(12)).toBe("12");
  });

  test("hasMinimumAddressForMatch matches API gate", () => {
    expect(hasMinimumAddressForMatch({ prefecture: "東京都" })).toBe(true);
    expect(hasMinimumAddressForMatch({ prefecture: " " })).toBe(false);
  });

  test("addressesStructurallyEqual ignores spacing variants", () => {
    expect(
      addressesStructurallyEqual(
        { prefecture: "東京都", municipality: "渋谷区", town: "恵比寿１丁目" },
        { prefecture: "東京都", municipality: "渋谷区", town: "恵比寿1丁目" },
      ),
    ).toBe(true);
  });

  test("buildSimilarPropertyCandidates: address-matched only; rank by area diff", () => {
    const p1 = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      label: null,
      prefecture: "東京都",
      municipality: "渋谷区",
      town: "恵比寿",
      district: 1,
      block: null,
      houseNumber: null,
      propertyType: "アパート" as const,
    };
    const p2 = {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      label: null,
      prefecture: "東京都",
      municipality: "渋谷区",
      town: "恵比寿",
      district: 2,
      block: null,
      houseNumber: null,
      propertyType: "アパート" as const,
    };
    const squareMetersByPropertyId = new Map<string, number[]>([
      [p1.id, [50, 52]],
      [p2.id, [40]],
    ]);
    const draft = {
      prefecture: "東京都",
      municipality: "渋谷区",
      town: "恵比寿",
      district: 1,
      squareM: 51,
    };
    const candidates = buildSimilarPropertyCandidates(draft, [p1, p2], squareMetersByPropertyId);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.propertyId).toBe(p1.id);
    expect(candidates[0]!.averageSquareM).toBe(round2(51));
    expect(candidates[0]!.areaDiffAbs).toBe(0);
  });
});
