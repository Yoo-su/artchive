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
import { QUERY_KEYS } from "@/shared/constants/query-keys";

/**
 * 리뷰 목록 조회
 */
export const useReviewsQuery = (params: GetReviewsParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(params),
    enabled: params.enabled !== false,
  });
};

/**
 * 리뷰 목록 무한 스크롤 조회
 */
export const useReviewsInfiniteQuery = (params: GetReviewsParams) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.reviewKeys.list(params).queryKey,
    queryFn: ({ pageParam = 1 }) => getReviews({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetReviewsResponse) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: params.enabled !== false,
    refetchOnMount: true,
  });
};

/**
 * 리뷰 피드 조회
 */
export const useReviewFeedsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
    queryFn: getReviewFeeds,
    enabled,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.popular.queryKey,
    queryFn: getPopularReviews,
    enabled,
  });
};

/**
 * 리뷰 상세 조회
 */
export const useReviewDetailQuery = (id: number, initialData?: Review) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.detail(id).queryKey,
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
    queryKey: QUERY_KEYS.reviewKeys.forEdit(id).queryKey,
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
    queryKey: [...QUERY_KEYS.reviewKeys.detail(id).queryKey, "reaction"],
    queryFn: () => getMyReviewReaction(id),
    enabled,
    staleTime: 30 * 1000,
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
    queryKey: QUERY_KEYS.reviewKeys.recommend(id).queryKey,
    queryFn: () => getRecommendedReviews(id),
    enabled,
  });
};
