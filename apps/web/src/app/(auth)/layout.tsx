"use client";

import type { ReactNode } from "react";
import { View } from "react-native";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <View className="min-h-screen flex-1 items-center justify-center bg-rose-pine-base p-4">
      <View className="w-full max-w-[420px] gap-4">{children}</View>
    </View>
  );
}
