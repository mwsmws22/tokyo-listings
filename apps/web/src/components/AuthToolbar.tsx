"use client";

import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { Pressable, Text, View } from "react-native";

type Props = Record<string, never>;

export function AuthToolbar(_: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const homeActive = pathname === "/";
  const addActive = pathname === "/listings/add";

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
    <View className="flex-row items-center justify-between border-b border-rose-pine-highlight-med bg-rose-pine-base px-4 py-3">
      <View className="min-w-[140px] flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          className={`rounded-md px-2 py-1 active:opacity-70 ${homeActive ? "bg-rose-pine-highlight-med/40" : ""}`}
          onPress={() => router.push("/")}
        >
          <Text className={`text-sm ${homeActive ? "text-rose-pine-text" : "text-rose-pine-foam"}`}>
            Home
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className={`rounded-md px-2 py-1 active:opacity-70 ${addActive ? "bg-rose-pine-highlight-med/40" : ""}`}
          onPress={() => router.push("/listings/add")}
        >
          <Text className={`text-sm ${addActive ? "text-rose-pine-text" : "text-rose-pine-foam"}`}>
            Add
          </Text>
        </Pressable>
      </View>
      <View className="flex-row items-center gap-2">
        <img src="/logo128_light.png" alt="Tokyo Listings logo" className="h-8 w-8 rounded-sm" />
        <Text className="text-2xl font-semibold text-rose-pine-text">Tokyo Listings</Text>
      </View>
      <View className="min-w-[140px] flex-row items-center justify-end">
        <Pressable className="rounded-md px-3 py-2 active:opacity-70" onPress={onSignOut}>
          <Text className="text-sm text-rose-pine-foam">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
