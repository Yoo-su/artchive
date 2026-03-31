import { getInsights as sharedGetInsights, getLocationSales as sharedGetLocationSales } from "@bookjeok/api-client";
import { InsightsResponse, LocationSales } from "@bookjeok/core";

import { publicAxios } from "@/shared/libs/axios";

/**
 * 서비스 인사이트 데이터를 조회합니다.
 * 로그인 없이 접근 가능합니다.
 */
export const getInsights = async (): Promise<InsightsResponse> => {
  return sharedGetInsights(publicAxios);
};

/**
 * 특정 지역의 최근 판매글 5개를 조회합니다.
 */
export const getLocationSales = async (
  city: string,
  district: string
): Promise<LocationSales[]> => {
  return sharedGetLocationSales(publicAxios, city, district);
};
