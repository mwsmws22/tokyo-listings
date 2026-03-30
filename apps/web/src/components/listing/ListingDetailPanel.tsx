"use client";

import { formatAreaSqm, formatRentYen } from "@/lib/listing-display";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue } from "jotai";
import { Text, View } from "react-native";

function valueOrNA(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

export function ListingDetailPanel() {
  const selectedId = useAtomValue(selectedListingIdAtom);
  const preview = useAtomValue(selectedListingPreviewAtom);
  const detailsQuery = trpc.listing.getById.useQuery(
    { id: selectedId ?? "" },
    { enabled: Boolean(selectedId) },
  );
  const row = detailsQuery.data ?? preview;

  if (!selectedId) {
    return (
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Listing details</Text>
        <Text className="text-sm text-rose-pine-muted">Select a listing to view details.</Text>
      </View>
    );
  }

  if (!row) {
    return <Text className="text-sm text-rose-pine-muted">Loading details…</Text>;
  }

  return (
    <View className="gap-2">
      <Text className="text-lg font-semibold text-rose-pine-text">{row.title}</Text>
      <Text className="text-sm text-rose-pine-muted">{formatRentYen(row.monthlyRentYen)}</Text>
      <Text className="text-sm text-rose-pine-muted">Address: {row.addressText}</Text>
      <Text className="text-sm text-rose-pine-muted">Area: {formatAreaSqm(row.squareM)}</Text>
      <Text className="text-sm text-rose-pine-muted">
        Fees: 礼金 {valueOrNA(row.reikinMonths)} / 敷金 {valueOrNA(row.securityDepositMonths)}
      </Text>
      <Text className="text-sm text-rose-pine-muted">
        Access: {valueOrNA(row.closestStation)} · 徒歩 {valueOrNA(row.walkingTimeMin)}分
      </Text>
      <Text className="text-sm text-rose-pine-muted">
        Availability: {valueOrNA(row.availability)}
      </Text>
      <Text className="text-sm text-rose-pine-muted">
        Property: {valueOrNA(row.property?.propertyType)} · {valueOrNA(row.property?.interest)}
      </Text>
      <Text className="text-sm text-rose-pine-muted">
        Location: {valueOrNA(row.property?.municipality)} {valueOrNA(row.property?.town)}
      </Text>
      <Text className="text-sm text-rose-pine-muted">
        Coordinates:{" "}
        {row.latitude != null && row.longitude != null
          ? `${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}`
          : "Location unavailable"}
      </Text>
    </View>
  );
}
