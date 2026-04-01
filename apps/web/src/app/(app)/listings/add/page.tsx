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
      setSelectedId(null);
      setSelectedPreview(null);
    };
  }, [setSelectedId, setSelectedPreview]);

  return (
    <ListingsMapWorkspace
      leftPane={
        <ScrollView className="max-h-[45vh] md:max-h-none">
          <View className="gap-3 px-3 py-2.5">
            <Text className="text-center text-2xl font-normal text-rose-pine-text">
              Add a Listing
            </Text>
            <ListingFormParity
              pending={createMut.isPending}
              onSubmit={(input) => createMut.mutate(input)}
            />
            {recent.length > 0 ? (
              <View className="gap-2 pt-2">
                <Text className="text-sm font-semibold text-rose-pine-text">
                  Recent submissions
                </Text>
                {recent.map((row) => (
                  <Pressable
                    key={row.id}
                    className="rounded-md border border-rose-pine-highlight-med px-3 py-2"
                    onPress={() => {
                      setSelectedId((prev) => (prev === row.id ? null : row.id));
                      setSelectedPreview((prev) => (prev?.id === row.id ? null : row));
                    }}
                  >
                    <Text className="font-medium text-rose-pine-text">{row.title}</Text>
                    <Text className="text-xs text-rose-pine-muted">
                      {row.monthlyRentYen.toLocaleString()} JPY
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      }
    />
  );
}
