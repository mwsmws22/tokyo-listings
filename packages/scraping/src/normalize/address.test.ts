import { describe, expect, it } from "vitest";
import { parseJapaneseAddressStructured } from "./address";

describe("parseJapaneseAddressStructured", () => {
  it("parses a Tokyo ward address starting with 東京都", async () => {
    const result = await parseJapaneseAddressStructured("東京都渋谷区渋谷１丁目１−１");
    expect(result.prefecture).toBe("東京都");
    expect(result.municipality).toBeTruthy();
  });
});
