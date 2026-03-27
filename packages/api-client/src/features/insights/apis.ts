import { API_PATHS } from "@bookjeok/core";
import { InsightsResponse, LocationSales } from "@bookjeok/core/insights";
import { AxiosInstance } from "axios";

/**
 * 서비스 인사이트 데이터를 조회합니다.
 */
export const getInsights = async (client: AxiosInstance): Promise<InsightsResponse> => {
  const { data } = await client.get<InsightsResponse>(API_PATHS.insights.base);
  return data;
};

/**
 * 특정 지역의 최근 판매글을 조회합니다.
 */
export const getLocationSales = async (
  client: AxiosInstance,
  city: string,
  district: string,
): Promise<LocationSales[]> => {
  const { data } = await client.get<LocationSales[]>(API_PATHS.insights.locationSales, {
    params: { city, district },
  });
  return data;
};
