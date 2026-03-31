"use client";
import { getMyReviewReaction, getPopularReviews, getRecommendedReviews, getReview, getReviewFeeds, getReviewForEdit, getReviews } from "@bookjeok/api-client";
import { reviewKeys, CACHE_TIME, GetReviewsParams, GetReviewsResponse, Review } from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 리뷰 목록 조회
 */
export const useReviewsQuery = (
  params: GetReviewsParams,
  client: AxiosInstance,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(client, params),
    enabled,
  });
};

/**
 * 리뷰 목록 무한 스크롤 조회
 */
export const useReviewsInfiniteQuery = (
  params: GetReviewsParams,
  client: AxiosInstance,
  enabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: ({ pageParam }) =>
      getReviews(client, {
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
export const useReviewFeedsQuery = (client: AxiosInstance, enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.feeds().queryKey,
    queryFn: () => getReviewFeeds(client),
    enabled,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (client: AxiosInstance, enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.popular.queryKey,
    queryFn: () => getPopularReviews(client),
    enabled,
  });
};

/**
 * 리뷰 상세 조회
 */
export const useReviewDetailQuery = (id: number, client: AxiosInstance, initialData?: Review) => {
  return useQuery({
    queryKey: reviewKeys.detail(id).queryKey,
    queryFn: () => getReview(client, id),
    initialData,
  });
};

/**
 * 수정용 리뷰 조회 (본인 리뷰만 조회 가능)
 */
export const useReviewForEditQuery = (id: number, client: AxiosInstance) => {
  return useQuery({
    queryKey: reviewKeys.forEdit(id).queryKey,
    queryFn: () => getReviewForEdit(client, id),
    enabled: !!id,
    retry: false,
  });
};

/**
 * 나의 리액션 조회
 */
export const useMyReviewReactionQuery = (
  id: number,
  client: AxiosInstance,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [...reviewKeys.detail(id).queryKey, "reaction"],
    queryFn: () => getMyReviewReaction(client, id),
    enabled,
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 추천 리뷰 조회
 */
export const useRecommendedReviewsQuery = (
  id: number,
  client: AxiosInstance,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.recommend(id).queryKey,
    queryFn: () => getRecommendedReviews(client, id),
    enabled,
  });
};
