"use client";

import { AuthToolbar } from "@/components/AuthToolbar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { Text, View } from "react-native";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (!session) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <View className="min-h-screen flex-1 items-center justify-center bg-rose-pine-base p-4">
        <Text className="text-rose-pine-muted">Loading…</Text>
      </View>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <View className="min-h-screen flex-1 bg-rose-pine-base">
      <AuthToolbar email={session.user.email} />
      {children}
    </View>
  );
}
