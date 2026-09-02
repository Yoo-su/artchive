import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Preview 환경(test.bookjeok.com 등)에서만 크롤러 차단
  if (process.env.VERCEL_ENV === "preview") {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
    };
  }

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
      // 네이버 크롤러(Yeti): 한국어 페이지만 수집하도록 /en을 차단한다.
      // 구글은 이 그룹을 읽지 않으므로 /en의 구글 색인에는 영향이 없다.
      //
      // robots.txt는 매칭되는 UA 그룹이 있으면 "*" 그룹을 무시하므로,
      // 아래 공통 비공개 경로를 여기에도 그대로 반복해야 한다.
      //
      // Allow를 함께 두면 안 된다. 네이버는 Allow가 Disallow보다 우선하므로
      // "Allow: /"가 있으면 아래 차단이 전부 무효가 된다. 명시적으로 막지 않은
      // 경로는 기본이 허용이므로 Disallow만 남긴다.
      //
      // /en을 세 가지 형태로 적는 이유: 네이버는 차단 경로를 "/not-for-naver/"
      // 처럼 슬래시로 끝나는 디렉터리 형태로 안내하며, 접두사만 적은 "/en"은
      // 실제로 매칭되지 않는 것을 검증 도구로 확인했다. 와일드카드는
      // "/*/my-page"가 정상 동작하는 것으로 지원이 확인되었다.
      {
        userAgent: "Yeti",
        disallow: [
          "/en",
          "/en/",
          "/en*",
          "/*/my-page",
          "/*/login",
          "/*/signup",
          "/*/callback",
        ],
      },
      // 일반 크롤러 허용 (Googlebot 등 포함)
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/*/my-page",
          "/*/login",
          "/*/signup",
          "/*/callback",
        ],
      },
    ],
    sitemap: "https://bookjeok.com/sitemap.xml",
  };
}
