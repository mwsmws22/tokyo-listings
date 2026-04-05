import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseListingPage } from "../../src/core/dispatch";
import { parseLifullHomesDetail } from "../../src/portals/homes";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "../fixtures/homes-detail.sample.html");
const fixtureDlPath = join(here, "../fixtures/homes-detail-dl.sample.html");
const fixtureTrafficMultilinePath = join(here, "../fixtures/homes-traffic-multiline.sample.html");
const fixtureCanonicalOnlyPath = join(
  here,
  "../fixtures/homes-detection-canonical-only.sample.html",
);

describe("parseLifullHomesDetail", () => {
  it("recognizes a chintai room page from canonical /chintai/room/{id} even when dl labels are absent", async () => {
    const html = readFileSync(fixtureCanonicalOnlyPath, "utf8");
    const r = await parseLifullHomesDetail(
      html,
      "https://www.homes.co.jp/chintai/room/689140c34049a740002534eaa19a6cbdde05d867/",
    );
    expect(r.status).toBe("parse_failed");
    if (r.status !== "parse_failed" || !("message" in r)) {
      return;
    }
    expect(r.message).toContain("賃料");
    expect(r.message).not.toContain("認識できません");
  });

  it("picks the nearest station when 交通 has multiple rail lines in one <p> with <br>", async () => {
    const html = readFileSync(fixtureTrafficMultilinePath, "utf8");
    const r = await parseLifullHomesDetail(
      html,
      "https://www.homes.co.jp/chintai/room/689140c34049a740002534eaa19a6cbdde05d867/",
    );
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.draft.closestStation).toBe("東大前駅");
    expect(r.draft.walkingTimeMin).toBe(3);
  });

  it("extracts golden fields from current (dl-based) LIFULL HOME'S room detail HTML", async () => {
    const html = readFileSync(fixtureDlPath, "utf8");
    const r = await parseLifullHomesDetail(
      html,
      "https://www.homes.co.jp/chintai/room/72c158252e699bed0d004850c999e588b8701c43/",
    );
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.draft.monthlyRentYen).toBe(101_000);
    expect(r.draft.squareM).toBeCloseTo(25.27, 5);
    expect(r.draft.addressText).toContain("台東区");
    expect(r.draft.closestStation).toContain("南千住駅");
    expect(r.draft.walkingTimeMin).toBe(10);
    expect(r.draft.reikinMonths).toBe(1);
    expect(r.draft.securityDepositMonths).toBe(1);
    expect(r.draft.propertyType).toBe("アパート");
  });

  it("extracts golden fields from legacy #chk-bkc fixture HTML", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseLifullHomesDetail(
      html,
      "https://www.homes.co.jp/chintai/room/6248a82beea587038f6783aad23dd34407591709/",
    );
    expect(r.status).toBe("ok");
    if (r.status !== "ok") {
      return;
    }
    expect(r.draft.monthlyRentYen).toBe(100_000);
    expect(r.draft.squareM).toBeCloseTo(26.63, 5);
    expect(r.draft.addressText).toContain("千住仲町");
    expect(r.draft.closestStation).toContain("北千住駅");
    expect(r.draft.walkingTimeMin).toBe(6);
    expect(r.draft.reikinMonths).toBe(0);
    expect(r.draft.securityDepositMonths).toBe(0);
    expect(r.draft.title).toContain("ＬａＬａ");
    expect(r.draft.availability).toBe("募集中");
    expect(r.draft.propertyType).toBe("アパート");
  });

  it("is registered on dispatch for portal lifull_homes (legacy markup)", async () => {
    const html = readFileSync(fixturePath, "utf8");
    const r = await parseListingPage(
      "lifull_homes",
      html,
      "https://www.homes.co.jp/chintai/room/6248a82beea587038f6783aad23dd34407591709/",
    );
    expect(r.status).toBe("ok");
  });

  it("is registered on dispatch for portal lifull_homes (dl markup)", async () => {
    const html = readFileSync(fixtureDlPath, "utf8");
    const r = await parseListingPage(
      "lifull_homes",
      html,
      "https://www.homes.co.jp/chintai/room/72c158252e699bed0d004850c999e588b8701c43/",
    );
    expect(r.status).toBe("ok");
  });
});
