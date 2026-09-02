import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin(
  "./src/shared/config/i18n/request.ts",
);

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output:
    process.env.OUTPUT_STANDALONE === "true" ||
    process.env.DOCKER === "true" ||
    process.platform !== "win32"
      ? "standalone"
      : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.kopis.or.kr",
      },
      {
        protocol: "https",
        hostname: "img1.kakaocdn.net",
      },
      {
        protocol: "http",
        hostname: "img1.kakaocdn.net",
      },
      {
        protocol: "http",
        hostname: "k.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "shopping-phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "image.aladin.co.kr",
      },
      {
        protocol: "http",
        hostname: "image.aladin.co.kr",
      },
    ],
  },
  // isomorphic-dompurify는 내부적으로 jsdom을 쓰는데, jsdom은 런타임에 자신의
  // default-stylesheet.css를 fs로 읽습니다. webpack이 번들링하면 이 파일이
  // 함께 옮겨지지 않아 ENOENT로 서버 렌더링이 실패하므로 번들에서 제외합니다.
  serverExternalPackages: ["isomorphic-dompurify"],
  transpilePackages: [
    "@bookjeok/react-query",
    "@bookjeok/core",
    "@bookjeok/api-client",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withAnalyzer(withNextIntl(nextConfig));
