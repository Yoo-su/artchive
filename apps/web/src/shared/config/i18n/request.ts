import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 이는 일반적으로 `[locale]` 세그먼트에 해당합니다.
  let locale = await requestLocale;

  // 유효한 로케일이 사용되었는지 확인합니다.
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../i18n/messages/${locale}.json`)).default,
  };
});
