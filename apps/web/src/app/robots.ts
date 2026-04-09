import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google 내부 R&D용 크롤러 차단 (검색 인덱싱과 무관)
      {
        userAgent: "GoogleOther",
        disallow: ["/"],
      },
      {
        userAgent: "GoogleOther-Image",
        disallow: ["/"],
      },
      {
        userAgent: "GoogleOther-Video",
        disallow: ["/"],
      },
      // Google AI 학습용 크롤러 차단 (Gemini, Bard 등)
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      // 일반 크롤러 허용 (Googlebot 포함)
      {
        userAgent: "*",
        allow: ["/", "/ko/", "/en/"],
        disallow: [
          "/my-page/",
          "/*/book/*/detail", // 도서 상세 페이지 크롤링 차단
          "/ko/book/*/detail",
          "/en/book/*/detail",
        ],
      },
    ],
    sitemap: "https://bookjeok.com/sitemap.xml",
  };
}
