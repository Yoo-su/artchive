import { useInsightsQuery as useBaseInsightsQuery, useLocationSalesQuery as useBaseLocationSalesQuery } from "@bookjeok/react-query";

import { publicAxios } from "@/shared/libs/axios";

export type {
  ActivityTrendStat,
  CategoryStat,
  InsightsResponse,
  LocationSales,
  LocationStat,
  PopularTagStat,
  PriceRangeStat,
  ReactionStat,
} from "@bookjeok/core";

export const useInsightsQuery = () => useBaseInsightsQuery(publicAxios);

export const useLocationSalesQuery = (city: string, district: string) =>
  useBaseLocationSalesQuery(city, district, publicAxios);
