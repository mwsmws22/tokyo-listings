import path from "node:path";
import { fileURLToPath } from "node:url";
import { withExpo } from "@expo/next-adapter";
import type { NextConfig } from "next";
import { withUniwind } from "uniwind-plugin-next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

const apiOrigin = process.env.API_DEV_ORIGIN ?? "http://localhost:4001";

/** Single root `.env` key; exposed to the browser bundle under Next’s `NEXT_PUBLIC_*` names. */
const googleMapsPublicEnv = {
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? "",
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID ?? "",
};

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  transpilePackages: ["react-native", "react-native-web"],
  env: googleMapsPublicEnv,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/trpc/:path*", destination: `${apiOrigin}/trpc/:path*` },
    ];
  },
};

export default withUniwind(withExpo(nextConfig), {
  cssEntryFile: "./src/app/globals.css",
});
