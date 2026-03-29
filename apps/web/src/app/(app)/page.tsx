"use client";

import { Text, View } from "react-native";

export default function HomePage() {
  return (
    <View className="flex-1 gap-2 bg-rose-pine-base p-4">
      <Text className="text-3xl font-bold text-rose-pine-text">Tokyo Listings</Text>
      <Text className="text-rose-pine-muted">
        You are signed in. Map and listings flows follow in later milestones.
      </Text>
    </View>
  );
}
