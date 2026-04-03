import path from "node:path";
import { fileURLToPath } from "node:url";
import { withExpo } from "@expo/next-adapter";
import type { NextConfig } from "next";
import { withUniwind } from "uniwind-plugin-next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

const apiOrigin = process.env.API_DEV_ORIGIN ?? "http://localhost:4001";

/** Inlined into the client bundle via `env` (from root `.env`). */
const googleMapsEnv = {
  GOOGLE_MAPS_API_KEY_CLIENT: process.env.GOOGLE_MAPS_API_KEY_CLIENT ?? "",
  GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID ?? "",
};

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  transpilePackages: ["react-native", "react-native-web"],
  env: googleMapsEnv,
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
