import type { NextConfig } from "next";
import { withTamagui } from "@tamagui/next-plugin";

const apiOrigin = process.env.API_DEV_ORIGIN ?? "http://localhost:8787";

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

export default withTamagui(nextConfig, {
  config: "./tamagui.config.ts",
  components: ["tamagui"],
});
