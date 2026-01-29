import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/config/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // 모든 경로에 대해 미들웨어를 실행하되, api, _next, 정적 파일은 제외합니다.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
