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
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function HomePage() {
  const toAddressFilterNumber = (value: string): number | undefined => {
    const ascii = value
      .trim()
      .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
    if (!ascii) return undefined;
    const n = Number.parseInt(ascii, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const [filters, setFilters] = useState<HomeListingFiltersState>({
    availability: "募集中",
    interest: "Top",
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
      district: toAddressFilterNumber(filters.district),
      block: toAddressFilterNumber(filters.block),
    }),
    [filters],
  );

  const listQuery = trpc.listing.list.useQuery(queryInput);

  useEffect(() => {
    return () => {
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
              My Listings
            </Text>
            <HomeListingFilters value={filters} onChange={setFilters} />
            <View className="h-2" />
            <HomeListingList
              listings={listQuery.data}
              selectedId={selectedId}
              isLoading={listQuery.isLoading}
              onSelect={(row) => {
                if (selectedId === row.id) {
                  setSelectedId(null);
                  setSelectedPreview(null);
                  return;
                }
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
