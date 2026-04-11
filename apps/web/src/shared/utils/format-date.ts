import { format, formatDistanceToNow } from "date-fns";
import { enUS, ko, Locale } from "date-fns/locale";

// 지원 로케일 → date-fns Locale 객체 매핑
const localeMap: Record<string, Locale> = {
  ko,
  en: enUS,
};

// 로케일별 사전 정의 포맷 패턴
const DATE_FORMATS = {
  ko: {
    full: "yyyy년 M월 d일",
    short: "yyyy.MM.dd",
    monthDay: "M월 d일",
    yearMonth: "yyyy년 M월",
    monthDayWeekday: "M월 d일 eeee",
    time: "p",
    monthDayShort: "M월 d일",
    day: "d",
  },
  en: {
    full: "MMMM d, yyyy",
    short: "MM/dd/yyyy",
    monthDay: "MMM d",
    yearMonth: "MMM yyyy",
    monthDayWeekday: "eeee, MMM d",
    time: "p",
    monthDayShort: "MMM d",
    day: "d",
  },
} as const;

/** 사전 정의 포맷 키 타입 */
export type DateFormatKey = keyof (typeof DATE_FORMATS)["ko"];

/**
 * 로케일 문자열에 해당하는 date-fns Locale 객체를 반환합니다.
 * 매핑되지 않는 로케일이면 기본값(ko)을 반환합니다.
 */
export function getDateLocale(locale: string): Locale {
  return localeMap[locale] ?? ko;
}

/**
 * 로케일 기반 날짜 포맷 함수.
 * 사전 정의 키(full, short 등)와 커스텀 포맷 문자열 모두 지원합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @param locale - 로케일 문자열 ("ko" | "en")
 * @param formatKeyOrPattern - 사전 정의 포맷 키 또는 커스텀 포맷 문자열
 */
export function formatDate(
  date: Date | string,
  locale: string,
  formatKeyOrPattern: DateFormatKey | string,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);
  const localeKey = locale in DATE_FORMATS ? locale : "ko";
  const formats = DATE_FORMATS[localeKey as keyof typeof DATE_FORMATS];

  // 사전 정의 키에 해당하면 로케일별 패턴 사용, 아니면 입력값을 패턴으로 직접 사용
  const pattern =
    (formats[formatKeyOrPattern as DateFormatKey] as string | undefined) ??
    formatKeyOrPattern;

  return format(dateObj, pattern, { locale: dateLocale });
}

/**
 * 로케일 기반 상대 시간 포맷 함수. (예: "3분 전", "2 hours ago")
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @param locale - 로케일 문자열 ("ko" | "en")
 */
export function formatRelativeTime(date: Date | string, locale: string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateLocale = getDateLocale(locale);

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: dateLocale,
  });
}
