import { describe, expect, test } from "bun:test";
import {
  computeSimilarPanelLeft,
  similarPropertiesIconDisabled,
} from "../../src/lib/similarPropertiesUi";

describe("similarPropertiesUi", () => {
  test("similarPropertiesIconDisabled: no match / greyed", () => {
    expect(similarPropertiesIconDisabled(0)).toBe(true);
    expect(similarPropertiesIconDisabled(-1)).toBe(true);
  });

  test("similarPropertiesIconDisabled: has candidates / active", () => {
    expect(similarPropertiesIconDisabled(1)).toBe(false);
    expect(similarPropertiesIconDisabled(3)).toBe(false);
  });

  test("computeSimilarPanelLeft prefers right of anchor when it fits", () => {
    const anchor = { top: 10, left: 100, width: 44, height: 34 };
    const left = computeSimilarPanelLeft(anchor, 280, 900);
    expect(left).toBe(100 + 44 + 8);
  });

  test("computeSimilarPanelLeft falls back left of anchor when right overflows", () => {
    const anchor = { top: 10, left: 700, width: 44, height: 34 };
    const panelW = 280;
    const vw = 800;
    const left = computeSimilarPanelLeft(anchor, panelW, vw);
    expect(left).toBe(anchor.left - 8 - panelW);
  });
});
