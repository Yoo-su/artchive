import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output:
    process.env.OUTPUT_STANDALONE === "true" ||
    process.env.DOCKER === "true" ||
    process.platform !== "win32"
      ? "standalone"
      : undefined,
  transpilePackages: [
    "@bookjeok/react-query",
    "@bookjeok/core",
    "@bookjeok/api-client",
  ],
};

export default nextConfig;
