import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "북적 (Bookjeok)",
    short_name: "북적",
    description:
      "AI 도서 추천·요약, 독서 기록, 리뷰, 중고책 거래 통합 도서 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/logo-square-sketch.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
