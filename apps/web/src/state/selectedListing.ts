"use client";

import type { ListingRow } from "@/types/trpc";
import { atom } from "jotai";

export const selectedListingIdAtom = atom<string | null>(null);
export const selectedListingPreviewAtom = atom<ListingRow | null>(null);
