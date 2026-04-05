"use client";

import { createElement } from "react";
import { Platform } from "react-native";

/**
 * Real DOM nodes so `mask` / conic-gradient animations apply (RN Web `View` often omits them).
 * Only the inner rotor rotates; the track stays fixed.
 */
export function UrlPreviewLoadingOverlay() {
  if (Platform.OS !== "web") {
    return null;
  }
  return createElement(
    "div",
    {
      className: "url-preview-loading-ring",
      "aria-hidden": true,
    },
    createElement("div", { className: "url-preview-loading-ring__rotor" }),
  );
}
