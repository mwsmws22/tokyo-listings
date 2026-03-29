"use client";

import { useMapInstance } from "@/components/map/MapInstanceContext";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useRef } from "react";

type Props = {
  selectedListingId: string | null;
  adjustPin: boolean;
  onSelectListing: (id: string) => void;
  onPinDragEnd: (id: string, lat: number, lng: number) => void;
};

export function ListingMarkers({
  selectedListingId,
  adjustPin,
  onSelectListing,
  onPinDragEnd,
}: Props) {
  const map = useMapInstance();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const { data: listings } = trpc.listing.list.useQuery({});

  useEffect(() => {
    if (!map) {
      return;
    }
    if (typeof window === "undefined" || !window.google?.maps?.Marker) {
      return;
    }
    const g = window.google;

    const markers = markersRef.current;
    for (const m of markers.values()) {
      m.setMap(null);
    }
    markers.clear();

    for (const row of listings ?? []) {
      if (row.latitude == null || row.longitude == null) {
        continue;
      }
      const marker = new g.maps.Marker({
        map,
        position: { lat: row.latitude, lng: row.longitude },
        draggable: adjustPin && selectedListingId === row.id,
        title: row.title,
      });
      marker.addListener("click", () => {
        onSelectListing(row.id);
      });
      marker.addListener("dragend", () => {
        const p = marker.getPosition();
        if (p) {
          onPinDragEnd(row.id, p.lat(), p.lng());
        }
      });
      markers.set(row.id, marker);
    }

    return () => {
      for (const m of markers.values()) {
        m.setMap(null);
      }
      markers.clear();
    };
  }, [map, listings, selectedListingId, adjustPin, onSelectListing, onPinDragEnd]);

  return null;
}
