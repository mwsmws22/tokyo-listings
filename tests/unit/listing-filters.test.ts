import { describe, expect, it } from "vitest";
import { buildListingWhereClause } from "../../apps/api/src/lib/listing-filters";

describe("buildListingWhereClause", () => {
  it("always includes user constraint", () => {
    const where = buildListingWhereClause("user-1", {});
    expect(where).toBeTruthy();
    expect(String(where)).toContain("listing");
  });

  it("includes optional parity filters", () => {
    const where = buildListingWhereClause("user-1", {
      availability: "募集中",
      propertyType: "アパート",
      prefecture: "東京都",
      town: "小石川",
    });

    expect(String(where)).toContain("募集中");
    expect(String(where)).toContain("アパート");
    expect(String(where)).toContain("小石川");
  });
});
