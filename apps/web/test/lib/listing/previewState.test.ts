import { describe, expect, test } from "bun:test";
import {
  createPreviewSuccessState,
  preservePreviewStateOnFailure,
} from "../../../src/lib/listing/previewState";

describe("previewState", () => {
  test("createPreviewSuccessState maps partial preview warnings + field errors", () => {
    const out = createPreviewSuccessState({
      status: "partial",
      portal: "lifull_homes",
      canonicalUrl: "https://www.homes.co.jp/chintai/room/x/",
      draft: {
        title: "x",
        addressText: "東京都文京区向丘1丁目",
        warnings: ["RENT_NOT_FOUND"],
        fieldErrors: {
          monthlyRentYen: "RENT_NOT_FOUND",
        },
      },
    });

    expect(out.status).toBe("partial");
    expect(out.warnings).toEqual(["RENT_NOT_FOUND"]);
    expect(out.fieldErrors).toEqual({ monthlyRentYen: "RENT_NOT_FOUND" });
    expect(out.prefill?.addressText).toBe("東京都文京区向丘1丁目");
  });

  test("preservePreviewStateOnFailure keeps existing prefill after failed retry", () => {
    const current = {
      prefill: {
        title: "Old title",
        addressText: "東京都渋谷区",
        monthlyRentYen: 120000,
      },
      warnings: ["OLD_WARNING"],
      fieldErrors: { squareM: "AREA_PARSE_FAILED" },
      status: "partial" as const,
      mapPreviewAddress: "東京都渋谷区",
    };
    const preserved = preservePreviewStateOnFailure(current);

    expect(preserved).toEqual(current);
    expect(preserved.prefill?.title).toBe("Old title");
  });
});
