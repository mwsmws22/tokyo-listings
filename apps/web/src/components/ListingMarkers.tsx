"use client";

import { useMapInstance } from "@/components/map/MapInstanceContext";
import { trpc } from "@/lib/trpc/client";
import type { ListingRow } from "@/types/trpc";
import { useEffect, useRef } from "react";

type Props = {
  selectedListingId: string | null;
  adjustPin: boolean;
  showExistingMarkers?: boolean;
  onSelectListing: (id: string) => void;
  onPinDragEnd: (id: string, lat: number, lng: number) => void;
  draftPin?: { lat: number; lng: number };
};

export function ListingMarkers({
  selectedListingId,
  adjustPin,
  showExistingMarkers = true,
  onSelectListing,
  onPinDragEnd,
  draftPin,
}: Props) {
  const map = useMapInstance();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const addDraftMarkerRef = useRef<google.maps.Marker | null>(null);
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

    if (showExistingMarkers) {
      const rowsByProperty = new Map<string, ListingRow>();
      for (const row of listings ?? []) {
        const pid = row.property?.id;
        if (!pid) continue;
        if (!rowsByProperty.has(pid)) rowsByProperty.set(pid, row);
      }

      for (const row of rowsByProperty.values()) {
        const lat = row.property?.latitude ?? row.latitude;
        const lng = row.property?.longitude ?? row.longitude;
        if (lat == null || lng == null) {
          continue;
        }
        const marker = new g.maps.Marker({
          map,
          position: { lat, lng },
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
    }

    return () => {
      for (const m of markers.values()) {
        m.setMap(null);
      }
      markers.clear();
      if (addDraftMarkerRef.current) {
        addDraftMarkerRef.current.setMap(null);
        addDraftMarkerRef.current = null;
      }
    };
  }, [map, listings, selectedListingId, adjustPin, showExistingMarkers, onSelectListing, onPinDragEnd]);

  useEffect(() => {
    if (!map || !window.google?.maps?.Marker) return;
    const g = window.google;
    if (addDraftMarkerRef.current) {
      addDraftMarkerRef.current.setMap(null);
      addDraftMarkerRef.current = null;
    }
    if (!draftPin) return;
    addDraftMarkerRef.current = new g.maps.Marker({
      map,
      position: { lat: draftPin.lat, lng: draftPin.lng },
      draggable: false,
      title: "Draft property pin",
      zIndex: 999,
    });
  }, [draftPin, map]);

  return null;
}
