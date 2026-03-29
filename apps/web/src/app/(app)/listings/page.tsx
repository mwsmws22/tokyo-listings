"use client";

import { ListingForm } from "@/components/ListingForm";
import { ListingMarkers } from "@/components/ListingMarkers";
import { MapShell } from "@/components/MapShell";
import { PinAdjustControls } from "@/components/PinAdjustControls";
import { listingsPageLabels } from "@/content/labels";
import { trpc } from "@/lib/trpc/client";
import type { ListingRow } from "@/types/trpc";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ListingsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjustPin, setAdjustPin] = useState(false);

  const utils = trpc.useUtils();
  const { data: listings } = trpc.listing.list.useQuery({});

  const selectedListing = useMemo(
    () => listings?.find((l) => l.id === selectedId) ?? null,
    [listings, selectedId],
  );

  const editingForForm: ListingRow | null = selectedListing ?? null;

  const updatePin = trpc.listing.update.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
    },
  });

  const onSelectListing = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const onPinDragEnd = useCallback(
    (id: string, lat: number, lng: number) => {
      updatePin.mutate({ id, latitude: lat, longitude: lng });
    },
    [updatePin],
  );

  const onCancelEdit = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <View className="min-h-0 flex-1 flex-col md:flex-row">
      <ScrollView className="max-h-[45vh] border-rose-pine-highlight-med md:max-h-none md:min-h-0 md:w-[380px] md:max-w-[40vw] md:flex-none md:border-r">
        <View className="gap-4 p-4">
          <View>
            <Text className="text-xl font-bold text-rose-pine-text">
              {listingsPageLabels.headingEn}{" "}
              <Text className="text-base font-normal text-rose-pine-muted">
                {listingsPageLabels.headingJp}
              </Text>
            </Text>
            <Text className="mt-1 text-sm text-rose-pine-muted">
              {listingsPageLabels.sidebarHintEn}
            </Text>
          </View>

          <ListingForm editing={editingForForm} onCancelEdit={onCancelEdit} />

          <View className="gap-2">
            <Text className="text-sm font-semibold text-rose-pine-text">Your listings</Text>
            {(listings ?? []).length === 0 ? (
              <Text className="text-sm text-rose-pine-muted">No listings yet.</Text>
            ) : (
              (listings ?? []).map((row) => (
                <Pressable
                  key={row.id}
                  className={`rounded-lg border px-3 py-2 ${
                    selectedId === row.id
                      ? "border-rose-pine-foam bg-rose-pine-surface"
                      : "border-rose-pine-highlight-med"
                  }`}
                  onPress={() => {
                    setSelectedId(row.id);
                  }}
                >
                  <Text className="font-medium text-rose-pine-text">{row.title}</Text>
                  <Text className="text-xs text-rose-pine-muted">
                    {row.monthlyRentYen.toLocaleString()} JPY · {row.geocodeStatus}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          <PinAdjustControls
            adjustPin={adjustPin}
            selectedListingId={selectedId}
            onAdjustPinChange={setAdjustPin}
          />
        </View>
      </ScrollView>

      <View className="min-h-[50vh] flex-1 md:min-h-0">
        <MapShell>
          <ListingMarkers
            adjustPin={adjustPin}
            selectedListingId={selectedId}
            onPinDragEnd={onPinDragEnd}
            onSelectListing={onSelectListing}
          />
        </MapShell>
      </View>
    </View>
  );
}
