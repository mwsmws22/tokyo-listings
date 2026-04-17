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
      interest: null,
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
      interest: null,
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

  test("buildSimilarPropertyCandidates: falls back to prefecture/city/town when no exact", () => {
    const p1 = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      label: null,
      prefecture: "東京都",
      municipality: "八王子市",
      town: "大和田町",
      district: 5,
      block: 5,
      houseNumber: 4,
      propertyType: "アパート" as const,
      interest: null,
    };
    const p2 = {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      label: null,
      prefecture: "東京都",
      municipality: "八王子市",
      town: "別町",
      district: 3,
      block: 8,
      houseNumber: 13,
      propertyType: "アパート" as const,
      interest: null,
    };
    const candidates = buildSimilarPropertyCandidates(
      {
        prefecture: "東京都",
        municipality: "八王子市",
        town: "大和田町",
        district: 3,
        block: 8,
        houseNumber: 13,
      },
      [p1, p2],
      new Map(),
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.propertyId).toBe(p1.id);
  });
});
