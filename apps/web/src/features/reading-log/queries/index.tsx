import {
  useLoungeActiveReadersQuery as useBaseLoungeActiveReadersQuery,
  useLoungeBookReadersInfiniteQuery as useBaseLoungeBookReadersInfiniteQuery,
  useLoungeFeedInfiniteQuery as useBaseLoungeFeedInfiniteQuery,
  useLoungePopularQuery as useBaseLoungePopularQuery,
  useReadingLogSettingsQuery as useBaseReadingLogSettingsQuery,
  useReadingLogsInfiniteQuery as useBaseReadingLogsInfiniteQuery,
  useReadingLogsQuery as useBaseReadingLogsQuery,
  useReadingLogStatsQuery as useBaseReadingLogStatsQuery,
} from "@bookjeok/react-query";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type { CreateReadingLogParams, ReadingLog } from "@bookjeok/core";

// 기존 훅들 (privateAxios 사용 - 인증 필요)
export const useReadingLogsQuery = (year: number, month: number, options?: { enabled?: boolean }) =>
  useBaseReadingLogsQuery(year, month, privateAxios, options);

export const useReadingLogStatsQuery = (year: number, month: number) =>
  useBaseReadingLogStatsQuery(year, month, privateAxios);

export const useReadingLogSettingsQuery = () =>
  useBaseReadingLogSettingsQuery(privateAxios);

export const useReadingLogsInfiniteQuery = () =>
  useBaseReadingLogsInfiniteQuery(privateAxios);

// ✅ 라운지 훅들 (publicAxios 사용 - 인증 불필요)
export const useLoungeFeedInfiniteQuery = () =>
  useBaseLoungeFeedInfiniteQuery(publicAxios);

export const useLoungePopularQuery = () =>
  useBaseLoungePopularQuery(publicAxios);

export const useLoungeActiveReadersQuery = () =>
  useBaseLoungeActiveReadersQuery(publicAxios);

export const useLoungeBookReadersInfiniteQuery = (isbn: string, enabled = true) =>
  useBaseLoungeBookReadersInfiniteQuery(publicAxios, isbn, enabled);

