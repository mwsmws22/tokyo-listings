"use client";

import { ListingMarkers } from "@/components/ListingMarkers";
import { MapShell } from "@/components/MapShell";
import { ListingDetailPanel } from "@/components/listing/ListingDetailPanel";
import { MapSelectionCoordinator } from "@/components/map/MapSelectionCoordinator";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useCallback } from "react";
import { View } from "react-native";

type Props = {
  leftPane: ReactNode;
};

export function ListingsMapWorkspace({ leftPane }: Props) {
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
      setSelectedId(id);
      const match = (listings ?? []).find((row) => row.id === id) ?? null;
      setSelectedPreview(match);
    },
    [setSelectedId, setSelectedPreview, listings],
  );

  const onPinDragEnd = useCallback(
    (id: string, lat: number, lng: number) => {
      updatePin.mutate({ id, latitude: lat, longitude: lng });
    },
    [updatePin],
  );

  return (
    <View className="min-h-0 flex-1 flex-col md:flex-row">
      <View className="max-h-[45vh] border-rose-pine-highlight-med md:max-h-none md:min-h-0 md:w-[380px] md:max-w-[40vw] md:flex-none md:border-r">
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
      </View>
      <View className="border-l border-rose-pine-highlight-med p-3 md:w-[340px] md:flex-none">
        <ListingDetailPanel />
      </View>
    </View>
  );
}
