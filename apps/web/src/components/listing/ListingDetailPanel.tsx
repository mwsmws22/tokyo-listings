"use client";

import { formatAreaSqm, formatRentYen } from "@/lib/listing-display";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue, useSetAtom } from "jotai";
import { Pressable, ScrollView, Text, View } from "react-native";

function valueOrNA(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

export function ListingDetailPanel() {
  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const preview = useAtomValue(selectedListingPreviewAtom);
  const listQuery = trpc.listing.list.useQuery({});
  const listings = listQuery.data ?? [];
  const fallbackId = listings[0]?.id ?? null;
  const effectiveSelectedId = selectedId ?? fallbackId;
  const detailsQuery = trpc.listing.getById.useQuery(
    { id: effectiveSelectedId ?? "" },
    { enabled: Boolean(effectiveSelectedId) },
  );
  const row =
    detailsQuery.data ??
    preview ??
    (effectiveSelectedId ? listings.find((item) => item.id === effectiveSelectedId) : null);
  const selectedIndex = effectiveSelectedId
    ? listings.findIndex((item) => item.id === effectiveSelectedId)
    : -1;

  if (!effectiveSelectedId) {
    return (
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Listing details</Text>
        <Text className="text-sm text-rose-pine-muted">No listings available.</Text>
      </View>
    );
  }

  if (!row) {
    return <Text className="text-sm text-rose-pine-muted">Loading details…</Text>;
  }

  const tableCellLabelClass =
    "w-[38%] border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle";
  const tableCellValueClass =
    "w-[62%] border-b border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text";

  function selectListing(id: string) {
    setSelectedId(id);
    const match = listings.find((item) => item.id === id) ?? null;
    setSelectedPreview(match);
  }

  return (
    <View className="min-h-0 flex-1 gap-3">
      <Text className="text-center text-base font-semibold text-rose-pine-text">
        Property #{selectedIndex >= 0 ? selectedIndex + 1 : "?"} Info
      </Text>

      <Text className="text-center text-sm font-semibold text-rose-pine-text">Basic Info</Text>
      <View className="overflow-hidden rounded-md border border-rose-pine-highlight-med">
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Monthly Rent</Text>
          <Text className={tableCellValueClass}>{formatRentYen(row.monthlyRentYen)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>礼金</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.reikinMonths)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>敷金</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.securityDepositMonths)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>面積</Text>
          <Text className={tableCellValueClass}>{formatAreaSqm(row.squareM)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Closest Station</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.closestStation)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Walking Time</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.walkingTimeMin)}分</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Availability</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.availability)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Interest</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.property?.interest)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Address</Text>
          <Text className={tableCellValueClass}>{valueOrNA(row.addressText)}</Text>
        </View>
        <View className="flex-row">
          <Text className={tableCellLabelClass}>Listings</Text>
          <Text className={tableCellValueClass} numberOfLines={1}>
            {valueOrNA(row.sourceUrl)}
          </Text>
        </View>
      </View>

      <Text className="text-center text-sm font-semibold text-rose-pine-text">Listings</Text>
      <ScrollView className="min-h-0 flex-1">
        <View className="gap-1.5">
          {listings.map((item) => (
            <Pressable
              key={item.id}
              className={`rounded-md border px-2.5 py-2 ${item.id === effectiveSelectedId ? "border-rose-pine-foam bg-rose-pine-foam/10" : "border-rose-pine-highlight-med bg-rose-pine-base"}`}
              onPress={() => selectListing(item.id)}
            >
              <Text className="text-[11px] text-rose-pine-text" numberOfLines={1}>
                {valueOrNA(item.sourceUrl)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
