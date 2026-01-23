import { createQueryKeys } from "@lukemorales/query-key-factory";

export const insightsKeys = createQueryKeys("insights", {
  // 전체 인사이트 데이터
  all: null,
  // 지역별 판매글
  locationSales: (city: string, district: string) => [city, district],
});
