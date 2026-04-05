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
  property?: {
    prefecture?: string | null;
    municipality?: string | null;
    town?: string | null;
    propertyType?: "一戸建て" | "アパート" | null;
  } | null;
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

function propertyTypeLabel(row: ListingRowWithProperty): "一戸建て" | "アパート" | "物件" {
  if (row.property?.propertyType) return row.property.propertyType;
  if (row.title.includes("アパート")) return "アパート";
  if (row.title.includes("一戸建て")) return "一戸建て";
  return "物件";
}

function listingHeadline(row: ListingRowWithProperty): string {
  const base = [row.property?.prefecture, row.property?.municipality, row.property?.town]
    .filter((p) => p != null && String(p).trim() !== "")
    .join("");
  const typeHint = propertyTypeLabel(row);
  if (base) return `${base}の${typeHint}`;
  const title = row.title?.trim();
  if (title) return title;
  return typeHint;
}

function monthsCompact(value: string | number | null | undefined): string {
  return formatMonthsJa(value).replace(/ヶ月$/, "");
}

function CompactListingMetaText({ row }: { row: ListingRowWithProperty }) {
  const rent = formatRentYen(row.monthlyRentYen);
  const area = formatAreaSqm(row.squareM);
  const reikin = monthsCompact(row.reikinMonths);
  const shiki = monthsCompact(row.securityDepositMonths);
  const station = valueOrNA(row.closestStation);
  const walk = valueOrNA(row.walkingTimeMin);
  const labelClass = "text-rose-pine-muted";
  const valueClass = "text-rose-pine-text";
  const sep = " / ";

  return (
    <Text className="text-[11px] leading-tight text-rose-pine-muted" numberOfLines={1}>
      <Text className={labelClass}>家賃</Text>
      <Text className={valueClass}>{` ${rent}`}</Text>
      {sep}
      <Text className={labelClass}>面積</Text>
      <Text className={valueClass}>{` ${area}`}</Text>
      {sep}
      <Text className={labelClass}>礼</Text>
      <Text className={valueClass}>{` ${reikin}`}</Text>
      {sep}
      <Text className={labelClass}>敷</Text>
      <Text className={valueClass}>{` ${shiki}`}</Text>
      {sep}
      <Text className={labelClass}>{`${station} `}</Text>
      <Text className={labelClass}>徒歩</Text>
      <Text className={valueClass}>{` ${walk}分`}</Text>
    </Text>
  );
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
            <Text className="text-lg leading-snug text-rose-pine-text">{listingHeadline(row)}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-1 max-h-5"
            >
              <CompactListingMetaText row={row} />
            </ScrollView>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
