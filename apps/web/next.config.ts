import { withTamagui } from "@tamagui/next-plugin";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_DEV_ORIGIN ?? "http://localhost:4001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["tamagui", "@tamagui/core", "@tamagui/config"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/trpc/:path*", destination: `${apiOrigin}/trpc/:path*` },
    ];
  },
};

export default withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
  // App Router: required so the compiler resolves `tamagui.config.ts` correctly (avoids "Missing theme displayName" / ProxyWorm).
  appDir: true,
  // Static extraction + webpack can break against some dependency trees in dev; runtime styles are fine for local work.
  disableExtraction: process.env.NODE_ENV === "development",
})(nextConfig);
