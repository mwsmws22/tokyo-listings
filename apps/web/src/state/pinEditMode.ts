"use client";

import { atom } from "jotai";

/**
 * True only when right-side detail panel is in Edit tab.
 * Map pin adjustments for existing properties are gated by this flag.
 */
export const pinEditModeAtom = atom(false);

