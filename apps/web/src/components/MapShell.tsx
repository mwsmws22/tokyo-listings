"use client";

import { MapInstanceProvider } from "@/components/map/MapInstanceContext";
import { defaultMapCenter, defaultMapZoom } from "@/content/labels";
import { mapReadyAtom } from "@/state/mapViewport";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useSetAtom } from "jotai";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

export function MapShell({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const setMapReady = useSetAtom(mapReadyAtom);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let cancelled = false;
    let idleListener: google.maps.MapsEventListener | null = null;

    (async () => {
      setOptions({ key: apiKey, v: "weekly" });
      const { Map: GoogleMap } = await importLibrary("maps");
      if (cancelled) {
        return;
      }
      const el = containerRef.current;
      if (!el) {
        return;
      }

      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      const mapInstance = new GoogleMap(el, {
        center: { lat: defaultMapCenter.lat, lng: defaultMapCenter.lng },
        zoom: defaultMapZoom,
        ...(mapId ? { mapId } : {}),
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      setMap(mapInstance);

      idleListener = mapInstance.addListener("idle", () => {
        setMapReady(true);
      });
    })().catch((err: unknown) => {
      console.error("Google Maps failed to load", err);
    });

    return () => {
      cancelled = true;
      idleListener?.remove();
      setMap(null);
      setMapReady(false);
      const el = containerRef.current;
      if (el) {
        el.replaceChildren();
      }
    };
  }, [apiKey, setMapReady]);

  if (!apiKey) {
    return (
      <View className="flex-1 items-center justify-center bg-rose-pine-base p-4">
        <Text className="text-center text-rose-pine-love">
          GOOGLE_MAPS_API_KEY is not set. Add it to the root .env file.
        </Text>
      </View>
    );
  }

  return (
    <MapInstanceProvider map={map}>
      <View className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          className="absolute inset-0 h-full w-full bg-rose-pine-surface"
          aria-label="Interactive map"
        />
        {children}
      </View>
    </MapInstanceProvider>
  );
}
