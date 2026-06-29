import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "북적 (Bookjeok)",
    short_name: "북적",
    description: "도서 리뷰, 중고책 거래, 독서 기록 서비스",
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
