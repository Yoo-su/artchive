"use client";
import {
  createReadingLog,
  deleteReadingLog,
  getLoungeActiveReaders,
  getLoungeBookReaders,
  getLoungeFeed,
  getLoungePopular,
  getReadingLogs,
  getReadingLogSettings,
  getReadingLogsInfinite,
  getReadingLogStats,
  updateReadingLog,
  updateReadingLogSettings,
} from "@bookjeok/api-client";
import { ActiveReadersResponse, CreateReadingLogParams, LoungeBookReadersResponse, LoungeFeedResponse, LoungePopularResponse, ReadingLog, readingLogKeys, UpdateReadingLogParams, User, userKeys } from "@bookjeok/core";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * 독서 기록 목록 조회 (월별/연별/최근 기록 통합)
 */
export const useReadingLogsQuery = (
  params?: { year?: number; month?: number; limit?: number },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.list(params).queryKey,
    queryFn: () => getReadingLogs(params),
    enabled: options?.enabled,
  });
};

/**
 * 월별 독서 통계 조회
 */
export const useReadingLogStatsQuery = (
  year: number,
  month: number,
) => {
  return useQuery({
    queryKey: readingLogKeys.stats(year, month).queryKey,
    queryFn: () => getReadingLogStats({ year, month }),
  });
};

/**
 * 독서 기록 설정 조회
 */
export const useReadingLogSettingsQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.settings.queryKey,
    queryFn: () => getReadingLogSettings(),
  });
};


/**
 * 독서 기록 설정 수정 뮤테이션
 */
export const useUpdateReadingLogSettingsMutation = (
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(isReadingLogPublic),
    onMutate: async (isReadingLogPublic) => {
      await queryClient.cancelQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      await queryClient.cancelQueries({ queryKey: userKeys.me.queryKey });

      const previousSettings = queryClient.getQueryData(
        readingLogKeys.settings.queryKey,
      );
      const previousUser = queryClient.getQueryData<User>(userKeys.me.queryKey);

      queryClient.setQueryData<{ isReadingLogPublic: boolean }>(
        readingLogKeys.settings.queryKey,
        (old) => (old ? { ...old, isReadingLogPublic } : { isReadingLogPublic }),
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
export const useReadingLogsInfiniteQuery = (options?: {
  enabled?: boolean;
}) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.infinite.queryKey,
    queryFn: ({ pageParam }) =>
      getReadingLogsInfinite(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options?.enabled,
  });
};

/**
 * 독서 기록 생성 뮤테이션
 */
export const useCreateReadingLogMutation = (
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation<
    ReadingLog,
    Error,
    CreateReadingLogParams & { idempotencyKey?: string }
  >({
    mutationFn: ({
      idempotencyKey,
      ...payload
    }: CreateReadingLogParams & { idempotencyKey?: string }) =>
      createReadingLog(payload as CreateReadingLogParams, {
        idempotencyKey,
      }),
    onSuccess: (data) => {
      if (data.date) {
        const [yearStr, monthStr] = data.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return [data];
            return [...old, data].sort((a, b) => a.date.localeCompare(b.date));
          },
        );
      }
      // 동기화를 위해 백그라운드로 캐시 전체 무효화
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
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation<ReadingLog, Error, UpdateReadingLogParams>({
    mutationFn: (params: UpdateReadingLogParams) =>
      updateReadingLog(params),
    onSuccess: (data) => {
      if (data.date) {
        const [yearStr, monthStr] = data.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return [data];
            return old
              .map((log) => (log.id === data.id ? data : log))
              .sort((a, b) => a.date.localeCompare(b.date));
          },
        );
      }
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
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; date: string }) =>
      deleteReadingLog(params.id),
    onSuccess: (_, variables) => {
      if (variables.date) {
        const [yearStr, monthStr] = variables.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return old;
            return old.filter((log) => log.id !== variables.id);
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 라운지 피드 무한 스크롤 조회 (공개 - publicAxios 주입)
 */
export const useLoungeFeedInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.loungeFeed.queryKey,
    queryFn: ({ pageParam }) =>
      getLoungeFeed(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60 * 1000, // 1분 (공개 피드이므로 적절한 staleTime)
  });
};

/**
 * 라운지 인기 도서 조회 (공개 - publicAxios 주입)
 */
export const useLoungePopularQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.loungePopular.queryKey,
    queryFn: () => getLoungePopular(),
    staleTime: 5 * 60 * 1000, // 5분 (인기도서는 자주 변하지 않으므로)
  });
};

/**
 * 라운지 열성 독서가 조회 (공개 - publicAxios 주입)
 */
export const useLoungeActiveReadersQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.loungeActiveReaders.queryKey,
    queryFn: () => getLoungeActiveReaders(),
    staleTime: 5 * 60 * 1000, // 5분 (자주 변하지 않으므로)
  });
};

/**
 * 특정 도서의 전체 독자 목록 무한 스크롤 (공개 - publicAxios 주입)
 * 상세 모달에서 사용
 */
export const useLoungeBookReadersInfiniteQuery = (
  isbn: string,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.loungeBookReaders(isbn).queryKey,
    queryFn: ({ pageParam }) =>
      getLoungeBookReaders(isbn, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 60 * 1000,
  });
};
