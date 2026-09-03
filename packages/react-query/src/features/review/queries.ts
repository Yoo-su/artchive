"use client";
import { getMyReviewReaction, getPopularReviews, getRecommendedReviews, getReview, getReviewFeeds, getReviewForEdit, getReviews } from "@bookjeok/api-client";
import { CACHE_TIME, GetReviewsParams, GetReviewsResponse, Review,reviewKeys } from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

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
    queryKey: reviewKeys.feeds().queryKey,
    queryFn: () => getReviewFeeds(),
    enabled,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.popular.queryKey,
    queryFn: () => getPopularReviews(),
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
    // ISR(1시간) 캐시 HTML 교정용
    // - 전역 기본값(staleTime: Infinity, refetchOnMount: false)이면 본문·반응 수가 영구 미갱신
    // - refetchOnMount는 staleness와 무관한 절대 게이트라 staleTime 단독으로는 리페치 불가
    // - initialDataUpdatedAt: 0으로 initialData를 stale 표기 (query-core가 `?? Date.now()`로 읽어 0이 유지됨)
    initialDataUpdatedAt: initialData ? 0 : undefined,
    staleTime: 30 * 1000,
    refetchOnMount: true,
  });
};

/**
 * 수정용 리뷰 조회 (본인 리뷰만 조회 가능)
 */
export const useReviewForEditQuery = (id: number) => {
  return useQuery({
    queryKey: reviewKeys.forEdit(id).queryKey,
    queryFn: () => getReviewForEdit(id),
    enabled: !!id,
    retry: false,
  });
};

/**
 * 나의 리액션 조회
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
 * 추천 리뷰 조회
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
