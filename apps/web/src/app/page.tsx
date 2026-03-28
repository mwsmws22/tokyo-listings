"use client";

import { Text, YStack } from "tamagui";

export default function HomePage() {
  return (
    <YStack padding="$4" flex={1} backgroundColor="$background">
      <Text fontSize="$8" fontWeight="700">
        Tokyo Listings
      </Text>
      <Text color="$color10" marginTop="$2">
        Baseline shell (Phase 2) — auth and listings API wired; sign-in flows land in US1.
      </Text>
    </YStack>
  );
}
