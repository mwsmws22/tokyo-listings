"use client";

import { useMapInstance } from "@/components/map/MapInstanceContext";
import { trpc } from "@/lib/trpc/client";
import { useEffect } from "react";

type Props = {
  /** Trimmed Japanese address from scrape prefill; empty disables the query. */
  address: string;
  onGeocoded?: (lat: number, lng: number) => void;
};

/**
 * When the add-listing flow fills an address (e.g. after URL preview), geocode it and
 * pan/zoom the map so the operator sees the right neighborhood immediately.
 */
export function AddListingGeocodeCoordinator({ address, onGeocoded }: Props) {
  const map = useMapInstance();
  const trimmed = address.trim();

  const { data, isSuccess } = trpc.map.geocode.useQuery(
    { address: trimmed },
    {
      enabled: trimmed.length >= 4,
      retry: false,
      staleTime: 60_000,
    },
  );

  const geocodeLat = isSuccess && data ? data.lat : undefined;
  const geocodeLng = isSuccess && data ? data.lng : undefined;

  useEffect(() => {
    if (!map || geocodeLat === undefined || geocodeLng === undefined) {
      return;
    }
    map.panTo({ lat: geocodeLat, lng: geocodeLng });
    map.setZoom(17);
    onGeocoded?.(geocodeLat, geocodeLng);
  }, [map, geocodeLat, geocodeLng, onGeocoded]);

  return null;
}
