"use client";

import { ListingMarkers } from "@/components/ListingMarkers";
import { MapShell } from "@/components/MapShell";
import { ListingDetailPanel } from "@/components/listing/ListingDetailPanel";
import { AddListingGeocodeCoordinator } from "@/components/map/AddListingGeocodeCoordinator";
import { MapPinClickCoordinator } from "@/components/map/MapPinClickCoordinator";
import { MapSelectionCoordinator } from "@/components/map/MapSelectionCoordinator";
import { trpc } from "@/lib/trpc/client";
import { pinEditModeAtom } from "@/state/pinEditMode";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect } from "react";
import { View } from "react-native";

type Props = {
  leftPane: ReactNode;
  detailPanelMode?: "selectedOnly" | "always";
  /**
   * When set (including `null`), enables add-flow map behavior: geocode this address after
   * URL preview and center the map. Omit on routes that are not add-listing.
   */
  addListingMapAddress?: string | null;
  /**
   * Add-flow draft pin movement by map click.
   */
  enableAddPinPlacement?: boolean;
  lockAddPinPlacement?: boolean;
  onAddPinChange?: (lat: number, lng: number) => void;
  addDraftPin?: { lat: number; lng: number } | null;
  showExistingPropertyPins?: boolean;
};

export function ListingsMapWorkspace({
  leftPane,
  detailPanelMode = "selectedOnly",
  addListingMapAddress,
  enableAddPinPlacement = false,
  lockAddPinPlacement = false,
  onAddPinChange,
  addDraftPin = null,
  showExistingPropertyPins = true,
}: Props) {
  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const pinEditMode = useAtomValue(pinEditModeAtom);
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

  const canEditExistingPinByMapClick =
    pinEditMode &&
    Boolean(selectedId) &&
    detailPanelMode === "selectedOnly" &&
    !enableAddPinPlacement &&
    !lockAddPinPlacement;

  const onMapPinClick = useCallback(
    (lat: number, lng: number) => {
      if (enableAddPinPlacement && !lockAddPinPlacement && onAddPinChange) {
        onAddPinChange(lat, lng);
        return;
      }
      if (canEditExistingPinByMapClick && selectedId) {
        updatePin.mutate({ id: selectedId, latitude: lat, longitude: lng });
      }
    },
    [
      canEditExistingPinByMapClick,
      enableAddPinPlacement,
      lockAddPinPlacement,
      onAddPinChange,
      selectedId,
      updatePin,
    ],
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
          {addListingMapAddress !== undefined ? (
            <AddListingGeocodeCoordinator
              address={addListingMapAddress ?? ""}
              onGeocoded={
                enableAddPinPlacement && !lockAddPinPlacement && onAddPinChange
                  ? onAddPinChange
                  : undefined
              }
            />
          ) : null}
          <ListingMarkers
            adjustPin={false}
            showExistingMarkers={showExistingPropertyPins}
            selectedListingId={selectedId}
            onSelectListing={onSelectListing}
            onPinDragEnd={onPinDragEnd}
            draftPin={enableAddPinPlacement && addDraftPin ? addDraftPin : undefined}
          />
          <MapSelectionCoordinator />
          <MapPinClickCoordinator
            enabled={
              (enableAddPinPlacement && !lockAddPinPlacement && Boolean(onAddPinChange)) ||
              canEditExistingPinByMapClick
            }
            onMapClick={onMapPinClick}
          />
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
