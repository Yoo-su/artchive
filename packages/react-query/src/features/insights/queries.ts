"use client";
import { getInsights, getLocationSales } from "@bookjeok/api-client";
import { insightsKeys } from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 서비스 인사이트 데이터 조회
 */
export const useInsightsQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: insightsKeys.all.queryKey,
    queryFn: () => getInsights(client),
  });
};

/**
 * 지역별 판매글 조회
 */
export const useLocationSalesQuery = (city: string, district: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: insightsKeys.locationSales(city, district).queryKey,
    queryFn: () => getLocationSales(client, city, district),
    enabled: !!city && !!district,
  });
};
