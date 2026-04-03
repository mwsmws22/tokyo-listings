"use client";

import { mapLabels } from "@/content/labels";
import { useRouter } from "next/navigation";
import { Pressable, Text, View } from "react-native";

export function MapEmptyState() {
  const router = useRouter();

  return (
    <View className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
      <View className="pointer-events-auto max-w-lg rounded-xl border border-rose-pine-highlight-med bg-rose-pine-surface/95 p-4 shadow-lg backdrop-blur-sm">
        <Text className="text-lg font-semibold text-rose-pine-text">
          {mapLabels.emptyTitleEn}{" "}
          <Text className="text-base font-normal text-rose-pine-muted">
            {mapLabels.emptyTitleJp}
          </Text>
        </Text>
        <Text className="mt-2 text-sm leading-relaxed text-rose-pine-muted">
          {mapLabels.emptyBodyEn}
        </Text>
        <Text className="mt-1 text-sm leading-relaxed text-rose-pine-muted">
          {mapLabels.emptyBodyJp}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-4 self-start rounded-lg bg-rose-pine-foam px-4 py-2 active:opacity-80"
          onPress={() => {
            router.push("/listings");
          }}
        >
          <Text className="text-sm font-medium text-rose-pine-base">
            {mapLabels.addListingEn} ({mapLabels.addListingJp})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
