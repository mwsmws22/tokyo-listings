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
    <View className="flex-row items-center justify-between border-b border-rose-pine-highlight-med bg-rose-pine-base px-4 py-3">
      <Text className="text-sm font-semibold text-rose-pine-text">{email}</Text>
      <Pressable className="rounded-lg px-3 py-2 active:opacity-70" onPress={onSignOut}>
        <Text className="text-sm text-rose-pine-foam">Sign out</Text>
      </Pressable>
    </View>
  );
}
