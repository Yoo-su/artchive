"use client";
import {
  createReadingLog,
  deleteReadingLog,
  getReadingLogs,
  getReadingLogSettings,
  getReadingLogsInfinite,
  getReadingLogStats,
  updateReadingLog,
  updateReadingLogSettings,
} from "@bookjeok/api-client";
import { CreateReadingLogParams, ReadingLog, readingLogKeys, UpdateReadingLogParams, User, userKeys } from "@bookjeok/core";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosInstance } from "axios";

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
export const useReadingLogStatsQuery = (
  year: number,
  month: number,
  client: AxiosInstance,
) => {
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
export const useUpdateReadingLogSettingsMutation = (
  client: AxiosInstance,
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(client, isReadingLogPublic),
    onMutate: async (isReadingLogPublic) => {
      await queryClient.cancelQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      await queryClient.cancelQueries({ queryKey: userKeys.me.queryKey });

      const previousSettings = queryClient.getQueryData(
        readingLogKeys.settings.queryKey,
      );
      const previousUser = queryClient.getQueryData<User>(userKeys.me.queryKey);

      queryClient.setQueryData(
        readingLogKeys.settings.queryKey,
        (old: any) => ({
          ...old,
          isReadingLogPublic,
        }),
      );

      if (previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, {
          ...previousUser,
          isReadingLogPublic,
        });
      }

      return { previousSettings, previousUser };
    },
    onError: (err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          readingLogKeys.settings.queryKey,
          context.previousSettings,
        );
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, context.previousUser);
      }
      options?.onError?.(err);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me.queryKey });
    },
  });
};

/**
 * 독서 기록 무한 스크롤 조회
 */
export const useReadingLogsInfiniteQuery = (client: AxiosInstance) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.infinite.queryKey,
    queryFn: ({ pageParam }) =>
      getReadingLogsInfinite(client, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

/**
 * 독서 기록 생성 뮤테이션
 */
export const useCreateReadingLogMutation = (
  client: AxiosInstance,
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idempotencyKey, ...payload }: CreateReadingLogParams & { idempotencyKey?: string }) =>
      createReadingLog(client, payload as CreateReadingLogParams, { idempotencyKey }),
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
export const useUpdateReadingLogMutation = (
  client: AxiosInstance,
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateReadingLogParams) =>
      updateReadingLog(client, params),
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
export const useDeleteReadingLogMutation = (
  client: AxiosInstance,
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; date: string }) =>
      deleteReadingLog(client, params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
