import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko"],
  defaultLocale: "ko",
  localePrefix: "always",
  localeDetection: false,
  // 미들웨어의 hreflang Link 응답 헤더 비활성화
  // - metadata.alternates가 HTML에서 이미 hreflang을 출력하므로 중복
  // - 헤더의 x-default가 로케일 없는 경로(301 리다이렉트 대상)를 정규 URL로 광고
  alternateLinks: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export type Locale = (typeof routing.locales)[number];
