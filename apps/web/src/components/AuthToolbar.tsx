"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Pressable, Text, View } from "react-native";

type Props = {
  email: string;
};

export function AuthToolbar({ email }: Props) {
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/login");
          router.refresh();
        },
      },
    });
  }

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-rose-pine-highlight-med bg-rose-pine-base px-4 py-3">
      <Text className="max-w-[40%] shrink text-sm font-semibold text-rose-pine-text">{email}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          className="rounded-lg px-2 py-1 active:opacity-70"
          onPress={() => router.push("/")}
        >
          <Text className="text-sm text-rose-pine-foam">Home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-lg px-2 py-1 active:opacity-70"
          onPress={() => router.push("/listings")}
        >
          <Text className="text-sm text-rose-pine-foam">Listings</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-lg px-2 py-1 active:opacity-70"
          onPress={() => router.push("/map")}
        >
          <Text className="text-sm text-rose-pine-foam">Map</Text>
        </Pressable>
        <Pressable className="rounded-lg px-3 py-2 active:opacity-70" onPress={onSignOut}>
          <Text className="text-sm text-rose-pine-foam">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
