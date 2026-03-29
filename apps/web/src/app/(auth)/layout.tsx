import type { ReactNode } from "react";
import { YStack } from "tamagui";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      alignItems="center"
      padding="$4"
    >
      <YStack width="100%" maxWidth={420} gap="$4">
        {children}
      </YStack>
    </YStack>
  );
}
