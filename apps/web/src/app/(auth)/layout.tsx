"use client";

import type { ReactNode } from "react";
import { Text, View } from "react-native";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <View className="min-h-screen flex-1 items-center justify-center bg-rose-pine-base px-4 pb-4 pt-4">
      <View className="w-full max-w-[420px] gap-4">
        <View className="flex-row items-center justify-center gap-2">
          <img
            src="/logo128_light.png"
            alt="Tokyo Listings logo"
            className="h-12 w-12 rounded-sm"
          />
          <Text className="text-3xl font-semibold text-rose-pine-text">Tokyo Listings</Text>
        </View>
        <View className="rounded-xl border border-rose-pine-highlight-med bg-rose-pine-base/50 p-4">
          {children}
        </View>
      </View>
    </View>
  );
}
