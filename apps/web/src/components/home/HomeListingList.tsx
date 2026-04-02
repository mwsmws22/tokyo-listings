"use client";

import { formatAreaSqm, formatMonthsJa, formatRentYen } from "@/lib/listing-display";
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

function compactListingMetaLine(row: ListingRowWithProperty): string {
  const rent = formatRentYen(row.monthlyRentYen);
  const area = formatAreaSqm(row.squareM);
  const reikin = formatMonthsJa(row.reikinMonths).replace(/ヶ月$/, "");
  const shiki = formatMonthsJa(row.securityDepositMonths).replace(/ヶ月$/, "");
  const station = valueOrNA(row.closestStation);
  const walk = valueOrNA(row.walkingTimeMin);
  return `${rent} / ${area} / 礼${reikin} / 敷${shiki} / ${station} 徒歩${walk}分`;
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
      <View className="overflow-hidden rounded-md border border-rose-pine-highlight-med">
        {listings.map((row, index) => (
          <Pressable
            key={row.id}
            className={`px-3 py-2 ${selectedId === row.id ? "border-l-2 border-l-rose-pine-iris bg-rose-pine-highlight-med/25" : "bg-rose-pine-base"} ${index < listings.length - 1 ? "border-b border-rose-pine-highlight-med" : ""}`}
            onPress={() => onSelect(row)}
          >
            <Text className="text-xl text-rose-pine-text">{compactAddress(row)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-5">
              <Text
                className="text-[10px] leading-tight text-rose-pine-muted"
                numberOfLines={1}
                ellipsizeMode="clip"
              >
                {compactListingMetaLine(row)}
              </Text>
            </ScrollView>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
