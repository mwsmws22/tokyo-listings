"use client";

import { MapEmptyState } from "@/components/MapEmptyState";
import { MapShell } from "@/components/MapShell";
import { mapLabels } from "@/content/labels";
import { Text, View } from "react-native";

export default function MapPage() {
  return (
    <View className="min-h-0 flex-1 flex-col">
      <View className="border-b border-rose-pine-highlight-med px-4 py-2">
        <Text className="text-lg font-semibold text-rose-pine-text">
          {mapLabels.titleEn}{" "}
          <Text className="text-base font-normal text-rose-pine-muted">{mapLabels.titleJp}</Text>
        </Text>
      </View>
      <View className="relative min-h-0 flex-1">
        <MapShell />
        <MapEmptyState />
      </View>
    </View>
  );
}
