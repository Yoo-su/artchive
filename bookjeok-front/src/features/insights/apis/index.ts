import { API_PATHS } from "@/shared/constants/apis";
import { publicAxios } from "@/shared/libs/axios";

import { InsightsResponse, LocationSales } from "../types";

/**
 * 서비스 인사이트 데이터를 조회합니다.
 * 로그인 없이 접근 가능합니다.
 */
export const getInsights = async (): Promise<InsightsResponse> => {
  const { data } = await publicAxios.get<InsightsResponse>(
    API_PATHS.insights.base
  );
  return data;
};

/**
 * 특정 지역의 최근 판매글 5개를 조회합니다.
 */
export const getLocationSales = async (
  city: string,
  district: string
): Promise<LocationSales[]> => {
  const { data } = await publicAxios.get<LocationSales[]>(
    API_PATHS.insights.locationSales,
    {
      params: { city, district },
    }
  );
  return data;
};
