import { defaultMapCenter, defaultMapZoom } from "@/content/labels";
import { atom } from "jotai";

export const mapCenterAtom = atom<{ lat: number; lng: number }>({
  lat: defaultMapCenter.lat,
  lng: defaultMapCenter.lng,
});

export const mapZoomAtom = atom(defaultMapZoom);

/** Set when the Google Map instance has finished initial layout */
export const mapReadyAtom = atom(false);
