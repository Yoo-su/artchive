import { useInsightsQuery as useBaseInsightsQuery, useLocationSalesQuery as useBaseLocationSalesQuery } from "@bookjeok/react-query";

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

export const useInsightsQuery = () => useBaseInsightsQuery();

export const useLocationSalesQuery = (city: string, district: string) =>
  useBaseLocationSalesQuery(city, district);
