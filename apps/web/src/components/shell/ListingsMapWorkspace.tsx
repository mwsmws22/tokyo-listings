"use client";

import { ListingMarkers } from "@/components/ListingMarkers";
import { MapShell } from "@/components/MapShell";
import { ListingDetailPanel } from "@/components/listing/ListingDetailPanel";
import { MapSelectionCoordinator } from "@/components/map/MapSelectionCoordinator";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect } from "react";
import { View } from "react-native";

type Props = {
  leftPane: ReactNode;
  detailPanelMode?: "selectedOnly" | "always";
};

export function ListingsMapWorkspace({ leftPane, detailPanelMode = "selectedOnly" }: Props) {
  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const { data: listings } = trpc.listing.list.useQuery({});
  const utils = trpc.useUtils();
  const updatePin = trpc.listing.update.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
    },
  });

  const onSelectListing = useCallback(
    (id: string) => {
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedPreview(null);
        return;
      }
      setSelectedId(id);
      const match = (listings ?? []).find((row) => row.id === id) ?? null;
      setSelectedPreview(match);
    },
    [selectedId, setSelectedId, setSelectedPreview, listings],
  );

  const onPinDragEnd = useCallback(
    (id: string, lat: number, lng: number) => {
      updatePin.mutate({ id, latitude: lat, longitude: lng });
    },
    [updatePin],
  );

  useEffect(() => {
    return () => {
      setSelectedId(null);
      setSelectedPreview(null);
    };
  }, [setSelectedId, setSelectedPreview]);

  return (
    <View className="min-h-0 flex-1 flex-col md:flex-row">
      <View className="max-h-[48vh] border-rose-pine-highlight-med md:max-h-none md:min-h-0 md:w-[420px] md:flex-none md:border-r">
        {leftPane}
      </View>
      <View className="relative min-h-[45vh] flex-1 md:min-h-0">
        <MapShell>
          <ListingMarkers
            adjustPin={false}
            selectedListingId={selectedId}
            onSelectListing={onSelectListing}
            onPinDragEnd={onPinDragEnd}
          />
          <MapSelectionCoordinator />
        </MapShell>
        {selectedId || detailPanelMode === "always" ? (
          <View className="absolute bottom-0 right-0 top-0 z-20 w-[420px] max-w-[420px] border-l border-rose-pine-highlight-med bg-rose-pine-base p-3 shadow-2xl">
            <ListingDetailPanel />
          </View>
        ) : null}
      </View>
    </View>
  );
}
