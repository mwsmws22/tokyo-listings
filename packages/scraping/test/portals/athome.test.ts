import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseListingPage } from "../../src/core/dispatch";
import { parseAthomeDetail } from "../../src/portals/athome";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "../fixtures/athome-detail.sample.html");
const deadFixturePath = join(here, "../fixtures/athome-dead.sample.html");
const captchaFixturePath = join(here, "../fixtures/athome-captcha.sample.html");

describe("parseAthomeDetail", () => {
  it("extracts golden fields from fixture HTML", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseAthomeDetail(html, "https://www.athome.co.jp/chintai/1107585425/");
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.draft.monthlyRentYen).toBe(125_000);
    expect(r.draft.squareM).toBe(25.5);
    expect(r.draft.addressText).toContain("大田区");
    expect(r.draft.closestStation).toBe("品川駅");
    expect(r.draft.walkingTimeMin).toBe(8);
    expect(r.draft.reikinMonths).toBe(1);
    expect(r.draft.securityDepositMonths).toBe(0);
    expect(r.draft.title).toContain("メゾン");
    expect(r.draft.availability).toBe("募集中");
    expect(r.draft.propertyType).toBe("アパート");
  });

  it("treats removed / ended listing pages as 契約済", async () => {
    const html = readFileSync(deadFixturePath, "utf8");
    const r = await parseAthomeDetail(html, "https://www.athome.co.jp/chintai/1119087022/");
    expect(r.status).toBe("partial");
    if (r.status !== "partial") {
      return;
    }
    expect(r.draft.availability).toBe("契約済");
    expect(r.draft.warnings).toContain("LISTING_REMOVED_OR_ENDED");
  });

  it("fails parse when Athome returns a captcha interstitial", async () => {
    const html = readFileSync(captchaFixturePath, "utf8");
    const r = await parseAthomeDetail(html, "https://www.athome.co.jp/chintai/123/");
    expect(r.status).toBe("parse_failed");
  });

  it("is registered on dispatch for portal athome", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseListingPage(
      "athome",
      html,
      "https://www.athome.co.jp/chintai/1107585425/",
    );
    expect(r.status).toBe("ok");
  });
});
