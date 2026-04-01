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

function compactAddress(row: ListingRowWithProperty): string {
  const base = [row.property?.municipality, row.property?.town].filter(Boolean).join("");
  const typeHint = row.title.includes("アパート")
    ? "アパート"
    : row.title.includes("一戸建て")
      ? "一戸建て"
      : "物件";
  return `${base}の${typeHint}`;
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
            className={`rounded-md border px-3 py-2 ${selectedId === row.id ? "border-rose-pine-iris bg-rose-pine-highlight-med/25" : "border-rose-pine-highlight-med"}`}
            onPress={() => onSelect(row)}
          >
            <Text className="text-xl text-rose-pine-text">{compactAddress(row)}</Text>
            <Text
              className="overflow-hidden text-[11px] text-rose-pine-muted"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              賃料:{" "}
              <Text className="font-semibold text-rose-pine-text">
                {formatRentYen(row.monthlyRentYen)}
              </Text>
              {"  /  "}面積:{" "}
              <Text className="font-semibold text-rose-pine-text">
                {formatAreaSqm(row.squareM)}
              </Text>
              {"  /  "}礼金:{" "}
              <Text className="font-semibold text-rose-pine-text">
                {valueOrNA(row.reikinMonths)}ヶ月
              </Text>
              {"  /  "}敷金:{" "}
              <Text className="font-semibold text-rose-pine-text">
                {valueOrNA(row.securityDepositMonths)}ヶ月
              </Text>
              {"  /  "}
              {valueOrNA(row.closestStation)} 徒歩
              <Text className="font-semibold text-rose-pine-text">
                {valueOrNA(row.walkingTimeMin)}分
              </Text>
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
