"use client";

import { TamaguiProvider } from "tamagui";
import config from "../../tamagui.config";
import { TrpcProvider } from "@/lib/trpc/Provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <TamaguiProvider config={config}>{children}</TamaguiProvider>
    </TrpcProvider>
  );
}
