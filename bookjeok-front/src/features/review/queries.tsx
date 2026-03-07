import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getMyReviewReaction,
  getPopularReviews,
  getRecommendedReviews,
  getReview,
  getReviewFeeds,
  getReviewForEdit,
  getReviews,
} from "@/features/review/apis";
import {
  GetReviewsParams,
  GetReviewsResponse,
  Review,
} from "@/features/review/types";
import { CACHE_TIME } from "@/shared/constants/cache";

import { reviewKeys } from "./constants/query-keys";

/**
 * 리뷰 목록 조회
 */
export const useReviewsQuery = (
  params: GetReviewsParams,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(params),
    enabled,
  });
};

/**
 * 리뷰 목록 무한 스크롤 조회
 */
export const useReviewsInfiniteQuery = (
  params: GetReviewsParams,
  enabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: ({ pageParam }) =>
      getReviews({
        ...params,
        cursorId: pageParam as number | undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: GetReviewsResponse) => {
      return lastPage.nextCursor ?? undefined;
    },
    enabled,
    refetchOnMount: true,
  });
};

/**
 * 리뷰 피드 조회
 */
export const useReviewFeedsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.feeds.queryKey,
    queryFn: getReviewFeeds,
    enabled,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.popular.queryKey,
    queryFn: getPopularReviews,
    enabled,
  });
};

/**
 * 리뷰 상세 조회
 */
export const useReviewDetailQuery = (id: number, initialData?: Review) => {
  return useQuery({
    queryKey: reviewKeys.detail(id).queryKey,
    queryFn: () => getReview(id),
    initialData,
  });
};

/**
 * 수정용 리뷰 조회 (본인 리뷰만 조회 가능)
 * 권한이 없으면 403 에러 발생
 */
export const useReviewForEditQuery = (id: number) => {
  return useQuery({
    queryKey: reviewKeys.forEdit(id).queryKey,
    queryFn: () => getReviewForEdit(id),
    enabled: !!id,
    retry: false, // 권한 부족(403) 시 재시도 방지
  });
};

/**
 * 나의 리액션 조회 (내 데이터 - 짧은 staleTime)
 */
export const useMyReviewReactionQuery = (
  id: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [...reviewKeys.detail(id).queryKey, "reaction"],
    queryFn: () => getMyReviewReaction(id),
    enabled,
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 추천 리뷰 조회 (복합 로직)
 */
export const useRecommendedReviewsQuery = (
  id: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.recommend(id).queryKey,
    queryFn: () => getRecommendedReviews(id),
    enabled,
  });
};
