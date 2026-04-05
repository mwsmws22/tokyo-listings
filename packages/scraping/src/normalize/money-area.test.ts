import { describe, expect, it } from "vitest";
import {
  parseMonthlyRentYenFromText,
  parseSquareMetersFromText,
  parseWalkingMinutesFromText,
} from "./money-area";

describe("parseMonthlyRentYenFromText", () => {
  it("parses 万円 with decimal", () => {
    expect(parseMonthlyRentYenFromText("賃料 12.5万円")).toBe(125_000);
  });
  it("parses 万 without 円", () => {
    expect(parseMonthlyRentYenFromText("12万")).toBe(120_000);
  });
  it("parses explicit yen with comma", () => {
    expect(parseMonthlyRentYenFromText("120,000円")).toBe(120_000);
  });
  it("returns undefined when missing", () => {
    expect(parseMonthlyRentYenFromText("no money")).toBeUndefined();
  });
});

describe("parseSquareMetersFromText", () => {
  it("parses ㎡", () => {
    expect(parseSquareMetersFromText("専有面積 25.5㎡")).toBe(25.5);
  });
  it("returns undefined when missing", () => {
    expect(parseSquareMetersFromText("—")).toBeUndefined();
  });
});

describe("parseWalkingMinutesFromText", () => {
  it("parses 徒歩n分", () => {
    expect(parseWalkingMinutesFromText("JR山手線 渋谷駅 徒歩8分")).toBe(8);
  });
  it("parses 歩n分", () => {
    expect(parseWalkingMinutesFromText("歩5分")).toBe(5);
  });
});
