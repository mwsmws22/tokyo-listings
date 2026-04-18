"use client";

import { useMapInstance } from "@/components/map/MapInstanceContext";
import { useEffect } from "react";

type Props = {
  enabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
};

export function MapPinClickCoordinator({ enabled, onMapClick }: Props) {
  const map = useMapInstance();

  useEffect(() => {
    if (!map || !enabled) return;
    const listener = map.addListener("click", (ev: google.maps.MapMouseEvent) => {
      const pos = ev.latLng;
      if (!pos) return;
      onMapClick(pos.lat(), pos.lng());
    });
    return () => listener.remove();
  }, [enabled, map, onMapClick]);

  return null;
}

