import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseListingPage } from "../../src/core/dispatch";
import { parseSuumoDetail } from "../../src/portals/suumo";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "../fixtures/suumo-detail.sample.html");

describe("parseSuumoDetail", () => {
  it("extracts golden fields from fixture HTML", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseSuumoDetail(html, "https://suumo.jp/chintai/jnc_000105536591/");
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.draft.monthlyRentYen).toBe(120_000);
    expect(r.draft.squareM).toBeCloseTo(63.97, 5);
    expect(r.draft.addressText).toContain("足立区");
    expect(r.draft.closestStation).toBe("北千住駅");
    expect(r.draft.walkingTimeMin).toBe(7);
    expect(r.draft.reikinMonths).toBe(2);
    expect(r.draft.securityDepositMonths).toBe(1);
    expect(r.draft.title).toContain("松本宅貸家");
    expect(r.draft.availability).toBe("募集中");
    expect(r.draft.propertyType).toBe("アパート");
  });

  it("fails when canonical is not a chintai/jnc_ detail URL", async () => {
    const html = `
      <!DOCTYPE html><html><head>
      <link rel="canonical" href="https://suumo.jp/chintai/" />
      </head><body><div class="property_view_note-emphasis">10万円</div></body></html>`;
    const r = await parseSuumoDetail(html, "https://suumo.jp/chintai/");
    expect(r.status).toBe("parse_failed");
  });

  it("is registered on dispatch for portal suumo", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseListingPage("suumo", html, "https://suumo.jp/chintai/jnc_000105536591/");
    expect(r.status).toBe("ok");
  });
});
