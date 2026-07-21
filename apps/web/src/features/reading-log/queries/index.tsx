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

export const useReadingLogsQuery = (year: number, month?: number, options?: { enabled?: boolean }) =>
  useBaseReadingLogsQuery(year, month!, options);

export const useReadingLogStatsQuery = (year: number, month: number) =>
  useBaseReadingLogStatsQuery(year, month);

export const useReadingLogSettingsQuery = () =>
  useBaseReadingLogSettingsQuery();

export const useReadingLogsInfiniteQuery = () =>
  useBaseReadingLogsInfiniteQuery();

// ✅ 라운지 훅들 (인증 불필요)
export const useLoungeFeedInfiniteQuery = () =>
  useBaseLoungeFeedInfiniteQuery();

export const useLoungePopularQuery = () =>
  useBaseLoungePopularQuery();

export const useLoungeActiveReadersQuery = () =>
  useBaseLoungeActiveReadersQuery();

export const useLoungeBookReadersInfiniteQuery = (isbn: string, enabled = true) =>
  useBaseLoungeBookReadersInfiniteQuery(isbn, enabled);

