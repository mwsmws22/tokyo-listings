import { describe, expect, it } from "vitest";
import { buildLinkedPropertyFillPatch } from "../../src/lib/property-association";

describe("buildLinkedPropertyFillPatch", () => {
  it("fills only missing address parts and does not overwrite existing", () => {
    const existing = {
      id: "p1",
      userId: "u1",
      displayNumber: 10,
      prefecture: "東京都",
      municipality: "八王子市",
      town: "大和田町",
      district: 5,
      block: null,
      houseNumber: null,
      propertyType: "アパート" as const,
      interest: null,
      latitude: null,
      longitude: null,
      pinExact: 0,
      label: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const patch = buildLinkedPropertyFillPatch(existing, {
      prefecture: "神奈川県",
      district: 7,
      block: 5,
      houseNumber: 4,
      interest: "Top",
    });
    expect(patch.prefecture).toBeUndefined();
    expect(patch.district).toBeUndefined();
    expect(patch.block).toBe(5);
    expect(patch.houseNumber).toBe(4);
    expect(patch.interest).toBe("Top");
    expect(patch.updatedAt).toBeInstanceOf(Date);
  });

  it("returns empty patch when nothing can be filled", () => {
    const existing = {
      id: "p1",
      userId: "u1",
      displayNumber: 10,
      prefecture: "東京都",
      municipality: "八王子市",
      town: "大和田町",
      district: 5,
      block: 5,
      houseNumber: 4,
      propertyType: "アパート" as const,
      interest: "Top" as const,
      latitude: null,
      longitude: null,
      pinExact: 0,
      label: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const patch = buildLinkedPropertyFillPatch(existing, {
      district: 5,
      block: 6,
      houseNumber: 9,
      interest: "Nah",
    });
    expect(patch).toEqual({});
  });
});

