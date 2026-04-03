"use client";

import { useMapInstance } from "@/components/map/MapInstanceContext";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

export function MapSelectionCoordinator() {
  const map = useMapInstance();
  const selectedId = useAtomValue(selectedListingIdAtom);
  const selectedPreview = useAtomValue(selectedListingPreviewAtom);

  useEffect(() => {
    if (!map || !selectedId || !selectedPreview) return;
    if (selectedPreview.latitude == null || selectedPreview.longitude == null) return;
    map.panTo({ lat: selectedPreview.latitude, lng: selectedPreview.longitude });
    map.setZoom(17);
  }, [map, selectedId, selectedPreview]);

  return null;
}
