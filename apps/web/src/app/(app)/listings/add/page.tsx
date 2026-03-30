"use client";

import { ListingFormParity } from "@/components/listing/ListingFormParity";
import { ListingsMapWorkspace } from "@/components/shell/ListingsMapWorkspace";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import type { ListingRow } from "@/types/trpc";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function AddListingsPage() {
  const [recent, setRecent] = useState<ListingRow[]>([]);
  const utils = trpc.useUtils();
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);

  const createMut = trpc.listing.create.useMutation({
    onSuccess: async (row) => {
      await utils.listing.list.invalidate();
      setRecent((prev) => [row as ListingRow, ...prev]);
    },
  });

  useEffect(() => {
    return () => {
      setRecent([]);
    };
  }, []);

  return (
    <ListingsMapWorkspace
      leftPane={
        <ScrollView className="max-h-[45vh] md:max-h-none">
          <View className="gap-4 p-4">
            <Text className="text-xl font-bold text-rose-pine-text">Add Listing</Text>
            <ListingFormParity
              pending={createMut.isPending}
              onSubmit={(input) => createMut.mutate(input)}
            />
            <View className="gap-2">
              <Text className="text-sm font-semibold text-rose-pine-text">Recent submissions</Text>
              {recent.length === 0 ? (
                <Text className="text-sm text-rose-pine-muted">
                  No submissions in this visit. History resets when leaving this page.
                </Text>
              ) : (
                recent.map((row) => (
                  <Pressable
                    key={row.id}
                    className="rounded-lg border border-rose-pine-highlight-med px-3 py-2"
                    onPress={() => {
                      setSelectedId(row.id);
                      setSelectedPreview(row);
                    }}
                  >
                    <Text className="font-medium text-rose-pine-text">{row.title}</Text>
                    <Text className="text-xs text-rose-pine-muted">
                      {row.monthlyRentYen.toLocaleString()} JPY
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      }
    />
  );
}
