import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/config/i18n/routing";

// 차단할 봇 User-Agent 패턴 목록
const BLOCKED_BOT_PATTERNS = [/GoogleOther/i, /Google-Extended/i];

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const country = request.headers.get("x-vercel-ip-country") || "";

  // 1. 중국 지역 트래픽 차단
  if (country === "CN") {
    return new NextResponse(null, { status: 403 });
  }

  // 2. 차단 대상 봇인지 확인 (User-Agent 기반)
  const isBlockedBot = BLOCKED_BOT_PATTERNS.some((pattern) =>
    pattern.test(userAgent),
  );

  if (isBlockedBot) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  return intlMiddleware(request);
}

export const config = {
  // 모든 경로에 대해 미들웨어를 실행하되, api, _next, 정적 파일은 제외합니다.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
