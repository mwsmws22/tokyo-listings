import { describe, expect, test } from "bun:test";
import { similarDraftIsQueryable } from "../../src/lib/similarDraft";

describe("similarDraftIsQueryable", () => {
  test("false when fewer than two non-whitespace characters total", () => {
    expect(similarDraftIsQueryable({})).toBe(false);
    expect(similarDraftIsQueryable({ prefecture: "東" })).toBe(false);
    expect(similarDraftIsQueryable({ prefecture: "", municipality: " " })).toBe(false);
  });

  test("true when at least two characters across structured parts (matches API min-address gate)", () => {
    expect(similarDraftIsQueryable({ prefecture: "東京都" })).toBe(true);
    expect(
      similarDraftIsQueryable({
        prefecture: "東京都",
        municipality: "",
        town: "",
        district: undefined,
        block: undefined,
        houseNumber: undefined,
      }),
    ).toBe(true);
  });
});
