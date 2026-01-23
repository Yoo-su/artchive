/**
 * 독서 기록(Reading Log) React Query 훅 모듈
 *
 * 이 모듈은 독서 기록 관련 데이터 페칭과 뮤테이션을 위한
 * React Query(TanStack Query) 훅들을 제공합니다.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { User } from "@/features/auth/types";
import { userKeys } from "@/features/user";

import {
  createReadingLog,
  deleteReadingLog,
  getReadingLogs,
  getReadingLogSettings,
  getReadingLogsInfinite,
  getReadingLogStats,
  updateReadingLog,
  updateReadingLogSettings,
} from "./apis";
import { readingLogKeys } from "./constants/query-keys";
import { CreateReadingLogParams, UpdateReadingLogParams } from "./types";

/**
 * 날짜 문자열에서 연도와 월을 추출하는 헬퍼 함수
 *
 * @param dateStr - ISO 8601 형식의 날짜 문자열 (예: "2024-01-15")
 * @returns 연도와 월 객체
 *
 * @internal
 */
const extractYearMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
};

/**
 * 월별 독서 기록을 조회하는 쿼리 훅
 *
 * 캘린더 뷰에서 특정 월의 독서 기록을 표시할 때 사용합니다.
 *
 * @param year - 조회할 연도
 * @param month - 조회할 월 (1-12)
 * @param options - 쿼리 옵션 (enabled 등)
 * @returns TanStack Query 결과 객체
 *
 * @example
 * const { data, isLoading } = useReadingLogsQuery(2024, 1);
 */
export const useReadingLogsQuery = (
  year: number,
  month: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.list(year, month).queryKey,
    queryFn: () => getReadingLogs(year, month),
    enabled: options?.enabled,
  });
};

/**
 * 월별/연간 독서 통계를 조회하는 쿼리 훅
 *
 * 이번 달 읽은 권수, 올해 읽은 권수 등을 표시할 때 사용합니다.
 *
 * @param year - 조회할 연도
 * @param month - 조회할 월 (1-12)
 * @returns TanStack Query 결과 객체
 *
 * @example
 * const { data } = useReadingLogStatsQuery(2024, 1);
 * // data: { monthlyCount: 5, yearlyCount: 12 }
 */
export const useReadingLogStatsQuery = (year: number, month: number) => {
  return useQuery({
    queryKey: readingLogKeys.stats(year, month).queryKey,
    queryFn: () => getReadingLogStats(year, month),
  });
};

/**
 * 독서 기록 설정을 조회하는 쿼리 훅
 *
 * 사용자의 독서 기록 공개/비공개 설정을 가져올 때 사용합니다.
 *
 * @returns TanStack Query 결과 객체
 *
 * @example
 * const { data } = useReadingLogSettingsQuery();
 * // data: { isReadingLogPublic: true }
 */
export const useReadingLogSettingsQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.settings.queryKey,
    queryFn: getReadingLogSettings,
  });
};

/**
 * 독서 기록 설정을 수정하는 뮤테이션 훅
 *
 * 독서 기록 공개 여부를 변경할 때 사용합니다.
 * 성공 시 캐시를 즉시 업데이트하여 UI에 반영합니다.
 */
export const useUpdateReadingLogSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(isReadingLogPublic),
    onMutate: async (newIsPublic) => {
      // 1. 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });

      // 2. 이전 값 스냅샷 저장
      const previousSettings = queryClient.getQueryData(
        readingLogKeys.settings.queryKey,
      );

      // 3. 낙관적 업데이트 적용
      queryClient.setQueryData(readingLogKeys.settings.queryKey, {
        isReadingLogPublic: newIsPublic,
      });

      // 내 프로필 캐시도 낙관적 업데이트 (선택적)
      const previousProfile = queryClient.getQueryData(userKeys.me.queryKey);
      if (previousProfile) {
        queryClient.setQueryData(
          userKeys.me.queryKey,
          (old: User | undefined) =>
            old
              ? {
                  ...old,
                  isReadingLogPublic: newIsPublic,
                }
              : old,
        );
      }

      // 4. 컨텍스트 반환 (롤백용)
      return { previousSettings, previousProfile };
    },
    onError: (err, newIsPublic, context) => {
      // 실패 시 롤백
      if (context?.previousSettings) {
        queryClient.setQueryData(
          readingLogKeys.settings.queryKey,
          context.previousSettings,
        );
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.me.queryKey, context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // 성공 시 서버에서 받은 최신 데이터로 캐시 확정 (Refetch 방지)
      queryClient.setQueryData(readingLogKeys.settings.queryKey, data);

      queryClient.setQueryData(userKeys.me.queryKey, (old: User | undefined) =>
        old
          ? {
              ...old,
              isReadingLogPublic: data.isReadingLogPublic,
            }
          : old,
      );
    },
  });
};

/**
 * 독서 기록을 무한 스크롤로 조회하는 쿼리 훅
 *
 * 리스트 뷰에서 모든 독서 기록을 페이지네이션으로 표시할 때 사용합니다.
 * 커서 기반 페이지네이션을 사용합니다.
 *
 * @returns TanStack Infinite Query 결과 객체
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useReadingLogsInfiniteQuery();
 */
export const useReadingLogsInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.infinite.queryKey,
    queryFn: getReadingLogsInfinite,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};

/**
 * 새로운 독서 기록을 생성하는 뮤테이션 훅
 *
 * 성공 시 해당 월의 목록/통계 쿼리와 무한 스크롤 쿼리를 자동으로 무효화합니다.
 *
 * @returns TanStack Mutation 결과 객체
 *
 * @example
 * const mutation = useCreateReadingLogMutation();
 * mutation.mutate({
 *   bookIsbn: "1234567890",
 *   bookTitle: "책 제목",
 *   date: "2024-01-15",
 *   memo: "재미있었다",
 * });
 */
export const useCreateReadingLogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateReadingLogParams) => createReadingLog(params),
    onSuccess: (data) => {
      // 생성된 기록의 날짜에서 년/월을 추출하여 해당 쿼리만 무효화
      const { year, month } = extractYearMonth(data.date);
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.list(year, month).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.stats(year, month).queryKey,
      });
      // 리스트 뷰용 infinite 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.infinite.queryKey,
      });
    },
  });
};

/**
 * 독서 기록을 삭제하는 뮤테이션 훅
 *
 * 삭제 시 해당 월의 쿼리를 무효화하기 위해 id와 date를 함께 받습니다.
 * 성공 시 해당 월의 목록/통계 쿼리와 무한 스크롤 쿼리를 자동으로 무효화합니다.
 *
 * @returns TanStack Mutation 결과 객체
 *
 * @example
 * const mutation = useDeleteReadingLogMutation();
 * mutation.mutate({ id: "uuid-1234", date: "2024-01-15" });
 */
export const useDeleteReadingLogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; date: string }) => deleteReadingLog(id),
    onSuccess: (_, variables) => {
      // 삭제된 기록의 날짜에서 년/월을 추출하여 해당 쿼리만 무효화
      const { year, month } = extractYearMonth(variables.date);
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.list(year, month).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.stats(year, month).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.infinite.queryKey,
      });
    },
  });
};

/**
 * 독서 기록을 수정하는 뮤테이션 훅
 *
 * 현재는 메모 수정만 지원합니다.
 * 성공 시 해당 월의 목록/통계 쿼리와 무한 스크롤 쿼리를 자동으로 무효화합니다.
 *
 * @returns TanStack Mutation 결과 객체
 *
 * @example
 * const mutation = useUpdateReadingLogMutation();
 * mutation.mutate({ id: "uuid-1234", memo: "다시 읽어봐야겠다" });
 */
export const useUpdateReadingLogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateReadingLogParams) => updateReadingLog(params),
    onSuccess: (data) => {
      // 수정된 기록의 날짜에서 년/월을 추출하여 해당 쿼리만 무효화
      const { year, month } = extractYearMonth(data.date);
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.list(year, month).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.stats(year, month).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.infinite.queryKey,
      });
    },
  });
};
