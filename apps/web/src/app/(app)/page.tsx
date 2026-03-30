"use client";

import {
  HomeListingFilters,
  type HomeListingFiltersState,
} from "@/components/home/HomeListingFilters";
import { HomeListingList } from "@/components/home/HomeListingList";
import { ListingsMapWorkspace } from "@/components/shell/ListingsMapWorkspace";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import type { ListingRow } from "@/types/trpc";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function HomePage() {
  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const [filters, setFilters] = useState<HomeListingFiltersState>({
    prefecture: "",
    municipality: "",
    town: "",
    district: "",
    block: "",
  });

  const queryInput = useMemo(
    () => ({
      propertyType: filters.propertyType,
      availability: filters.availability,
      interest: filters.interest,
      prefecture: filters.prefecture || undefined,
      municipality: filters.municipality || undefined,
      town: filters.town || undefined,
      district: filters.district || undefined,
      block: filters.block || undefined,
    }),
    [filters],
  );

  const listQuery = trpc.listing.list.useQuery(queryInput);

  const clearFilters = () =>
    setFilters({
      prefecture: "",
      municipality: "",
      town: "",
      district: "",
      block: "",
    });

  return (
    <ListingsMapWorkspace
      leftPane={
        <ScrollView className="max-h-[45vh] md:max-h-none">
          <View className="gap-4 p-4">
            <Text className="text-3xl font-bold text-rose-pine-text">Tokyo Listings</Text>
            <HomeListingFilters value={filters} onChange={setFilters} onClear={clearFilters} />
            <HomeListingList
              listings={listQuery.data}
              selectedId={selectedId}
              isLoading={listQuery.isLoading}
              onSelect={(row) => {
                setSelectedId(row.id);
                setSelectedPreview(row as ListingRow);
              }}
            />
          </View>
        </ScrollView>
      }
    />
  );
}
