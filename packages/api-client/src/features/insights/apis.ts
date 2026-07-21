import { API_PATHS, InsightsResponse, LocationSales } from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * 서비스 인사이트 데이터를 조회합니다.
 */
export const getInsights = async (): Promise<InsightsResponse> => {
  const { data } = await privateApiClient.get<InsightsResponse>(API_PATHS.insights.base);
  return data;
};

/**
 * 특정 지역의 최근 판매글을 조회합니다.
 */
export const getLocationSales = async (
  city: string,
  district: string,
): Promise<LocationSales[]> => {
  const { data } = await privateApiClient.get<LocationSales[]>(API_PATHS.insights.locationSales, {
    params: { city, district },
  });
  return data;
};
