"use client";

import { TrpcProvider } from "@/lib/trpc/Provider";
import { TamaguiProvider } from "tamagui";
import config from "../../tamagui.config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <TamaguiProvider config={config} defaultTheme="rose-pine-moon">
        {children}
      </TamaguiProvider>
    </TrpcProvider>
  );
}
