"use client";
import { createReadingLog, deleteReadingLog, getReadingLogs, getReadingLogSettings, getReadingLogsInfinite,getReadingLogStats, updateReadingLog, updateReadingLogSettings } from "@bookjeok/api-client/reading-log";
import { CreateReadingLogParams, ReadingLog, UpdateReadingLogParams } from "@bookjeok/core/reading-log";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { readingLogKeys } from "./query-keys";

/**
 * 월별 독서 기록 조회
 */
export const useReadingLogsQuery = (
  year: number,
  month: number,
  client: AxiosInstance,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.list(year, month).queryKey,
    queryFn: () => getReadingLogs(client, { year, month }),
    enabled: options?.enabled,
  });
};

/**
 * 월별 독서 통계 조회
 */
export const useReadingLogStatsQuery = (year: number, month: number, client: AxiosInstance) => {
  return useQuery({
    queryKey: readingLogKeys.stats(year, month).queryKey,
    queryFn: () => getReadingLogStats(client, { year, month }),
  });
};

/**
 * 독서 기록 설정 조회
 */
export const useReadingLogSettingsQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: readingLogKeys.settings.queryKey,
    queryFn: () => getReadingLogSettings(client),
  });
};

/**
 * 독서 기록 설정 수정 뮤테이션
 */
export const useUpdateReadingLogSettingsMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(client, isReadingLogPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingLogKeys.settings.queryKey });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 무한 스크롤 조회
 */
export const useReadingLogsInfiniteQuery = (client: AxiosInstance) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.infinite.queryKey,
    queryFn: ({ pageParam }) => getReadingLogsInfinite(client, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

/**
 * 독서 기록 생성 뮤테이션
 */
export const useCreateReadingLogMutation = (client: AxiosInstance, options?: { onSuccess?: (data: ReadingLog) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReadingLogParams) => createReadingLog(client, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 수정 뮤테이션
 */
export const useUpdateReadingLogMutation = (client: AxiosInstance, options?: { onSuccess?: (data: ReadingLog) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateReadingLogParams) => updateReadingLog(client, params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 삭제 뮤테이션
 */
export const useDeleteReadingLogMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; date: string }) => deleteReadingLog(client, params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
