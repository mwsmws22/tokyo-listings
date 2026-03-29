"use client";

import { type ReactNode, createContext, useContext } from "react";

const MapInstanceContext = createContext<google.maps.Map | null>(null);

export function MapInstanceProvider({
  map,
  children,
}: {
  map: google.maps.Map | null;
  children: ReactNode;
}) {
  return <MapInstanceContext.Provider value={map}>{children}</MapInstanceContext.Provider>;
}

export function useMapInstance() {
  return useContext(MapInstanceContext);
}
