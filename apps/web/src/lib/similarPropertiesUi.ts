/** Icon is disabled when there are no address-matched candidates (see add-listing similar-properties flow). */
export function similarPropertiesIconDisabled(candidateCount: number): boolean {
  return candidateCount <= 0;
}

/** Viewport bounds of the 🏢 control from `getBoundingClientRect` (or `measureInWindow`). */
export type SimilarPropertiesAnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Horizontal position for a fixed panel: prefer immediately to the right of the anchor; if that
 * overflows the viewport, place to the left of the anchor; otherwise clamp.
 */
export function computeSimilarPanelLeft(
  anchor: SimilarPropertiesAnchorRect,
  panelWidth: number,
  viewportWidth: number,
  options?: { gap?: number; margin?: number },
): number {
  const gap = options?.gap ?? 8;
  const margin = options?.margin ?? 8;
  const preferRight = anchor.left + anchor.width + gap;
  if (preferRight + panelWidth <= viewportWidth - margin) {
    return preferRight;
  }
  const leftOfButton = anchor.left - gap - panelWidth;
  if (leftOfButton >= margin) {
    return leftOfButton;
  }
  return Math.max(margin, Math.min(preferRight, viewportWidth - margin - panelWidth));
}

export function computeSimilarPanelMaxHeight(
  anchorTop: number,
  viewportHeight: number,
  margin = 8,
): number {
  return Math.max(96, viewportHeight - anchorTop - margin);
}
