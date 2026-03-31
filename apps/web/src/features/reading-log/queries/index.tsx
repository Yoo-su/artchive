import { useReadingLogSettingsQuery as useBaseReadingLogSettingsQuery, useReadingLogsInfiniteQuery as useBaseReadingLogsInfiniteQuery, useReadingLogsQuery as useBaseReadingLogsQuery, useReadingLogStatsQuery as useBaseReadingLogStatsQuery } from "@bookjeok/react-query";

import { privateAxios } from "@/shared/libs/axios";

export type { CreateReadingLogParams,ReadingLog } from "@bookjeok/core";

export const useReadingLogsQuery = (year: number, month: number, options?: { enabled?: boolean }) =>
  useBaseReadingLogsQuery(year, month, privateAxios, options);

export const useReadingLogStatsQuery = (year: number, month: number) =>
  useBaseReadingLogStatsQuery(year, month, privateAxios);

export const useReadingLogSettingsQuery = () =>
  useBaseReadingLogSettingsQuery(privateAxios);

export const useReadingLogsInfiniteQuery = () =>
  useBaseReadingLogsInfiniteQuery(privateAxios);

