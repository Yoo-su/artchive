import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  transpilePackages: [
    "@bookjeok/react-query",
    "@bookjeok/core",
    "@bookjeok/api-client",
  ],
};

export default nextConfig;
