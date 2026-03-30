"use client";

import { formatAreaSqm, formatRentYen } from "@/lib/listing-display";
import { Pressable, ScrollView, Text, View } from "react-native";

type ListingRowWithProperty = {
  id: string;
  title: string;
  monthlyRentYen: number;
  squareM?: string | number | null;
  reikinMonths?: string | number | null;
  securityDepositMonths?: string | number | null;
  closestStation?: string | null;
  walkingTimeMin?: number | null;
  property?: { municipality?: string | null; town?: string | null } | null;
};

type Props = {
  listings: ListingRowWithProperty[] | undefined;
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (row: ListingRowWithProperty) => void;
};

function valueOrNA(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

export function HomeListingList({ listings, selectedId, isLoading, onSelect }: Props) {
  if (isLoading) {
    return <Text className="text-rose-pine-muted">Loading listings…</Text>;
  }

  if (!listings || listings.length === 0) {
    return <Text className="text-rose-pine-muted">No listings match current filters.</Text>;
  }

  return (
    <ScrollView className="min-h-0 flex-1">
      <View className="gap-2">
        {listings.map((row) => (
          <Pressable
            key={row.id}
            className={`rounded-lg border p-3 ${selectedId === row.id ? "border-rose-pine-foam bg-rose-pine-surface" : "border-rose-pine-highlight-med"}`}
            onPress={() => onSelect(row)}
          >
            <Text className="font-semibold text-rose-pine-text">{row.title}</Text>
            <Text className="text-xs text-rose-pine-muted">
              {formatRentYen(row.monthlyRentYen)}
            </Text>
            <Text className="text-xs text-rose-pine-muted">
              {formatAreaSqm(row.squareM)} · 礼金 {valueOrNA(row.reikinMonths)}ヶ月 · 敷金{" "}
              {valueOrNA(row.securityDepositMonths)}ヶ月
            </Text>
            <Text className="text-xs text-rose-pine-muted">
              {valueOrNA(row.closestStation)} · 徒歩 {valueOrNA(row.walkingTimeMin)}分
            </Text>
            <Text className="text-xs text-rose-pine-muted">
              {[row.property?.municipality, row.property?.town].filter(Boolean).join(" ")}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
