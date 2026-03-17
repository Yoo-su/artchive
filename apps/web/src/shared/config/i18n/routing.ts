import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko"],
  defaultLocale: "ko",
});

// Next.js의 네비게이션 API를 감싸는 경량 래퍼로,
// 로케일을 자동으로 처리합니다.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
