import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google 내부 R&D용 크롤러 (Search Console 라이브 테스트 및 진단 지원을 위해 허용)
      /* {
        userAgent: "GoogleOther",
        allow: ["/"],
      },
      {
        userAgent: "GoogleOther-Image",
        allow: ["/"],
      },
      {
        userAgent: "GoogleOther-Video",
        allow: ["/"],
      },
      // Google AI 학습용 크롤러 차단 (Gemini 등의 학습 데이터 수집 제한 - 필요한 경우 삭제 가능)
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      }, */
      // 일반 크롤러 허용 (Googlebot, Naveron 등 포함)
      {
        userAgent: "*",
        allow: ["/", "/ko/", "/en/"],
        disallow: [
          "/my-page/",
          "/*/my-page/",
          "/*/my-page/*",
          "/ko/my-page/",
          "/en/my-page/", // 다국어(ko, en) 마이페이지 및 하위 경로 차단
        ],
      },
    ],
    sitemap: "https://bookjeok.com/sitemap.xml",
  };
}
