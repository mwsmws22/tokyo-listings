"use client";

import { AuthToolbar } from "@/components/AuthToolbar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { Paragraph, YStack } from "tamagui";

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
      <YStack
        flex={1}
        padding="$4"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
      >
        <Paragraph color="$color10">Loading…</Paragraph>
      </YStack>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <AuthToolbar email={session.user.email} />
      {children}
    </YStack>
  );
}
