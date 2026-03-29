import path from "node:path";
import { fileURLToPath } from "node:url";
import { withExpo } from "@expo/next-adapter";
import type { NextConfig } from "next";
import { withUniwind } from "uniwind-plugin-next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, "../..");

const apiOrigin = process.env.API_DEV_ORIGIN ?? "http://localhost:4001";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  transpilePackages: ["react-native", "react-native-web"],
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
