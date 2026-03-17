/**
 * 인사이트 관련 상수
 */

// 가격 구간 정의 (원)
export const PRICE_RANGES = [
  { min: 0, max: 5000, label: '0-5000' },
  { min: 5000, max: 10000, label: '5000-10000' },
  { min: 10000, max: 20000, label: '10000-20000' },
  { min: 20000, max: 30000, label: '20000-30000' },
  { min: 30000, max: 50000, label: '30000-50000' },
  { min: 50000, max: 100000, label: '50000-100000' },
] as const;

// 활동 추이 조회 일수
export const ACTIVITY_TREND_DAYS = 30;

// 인기 태그 조회 개수
export const POPULAR_TAGS_LIMIT = 20;

// 지역별 판매글 조회 제한
export const LOCATION_SALES_LIMIT = 5;

// 지역별 거래 현황 조회 제한
export const LOCATION_STATS_LIMIT = 50;
