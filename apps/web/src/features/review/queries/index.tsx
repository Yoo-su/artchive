import { formatPostDate, GetReviewsParams, Review, UsedBookSale } from "@bookjeok/core";
import {
  useMyReviewReactionQuery as useBaseMyReviewReactionQuery,
  usePopularReviewsQuery as useBasePopularReviewsQuery,
  useRecommendedReviewsQuery as useBaseRecommendedReviewsQuery,
  useReviewDetailQuery as useBaseReviewDetailQuery,
  useReviewFeedsQuery as useBaseReviewFeedsQuery,
  useReviewForEditQuery as useBaseReviewForEditQuery,
  useReviewsInfiniteQuery as useBaseReviewsInfiniteQuery,
  useReviewsQuery as useBaseReviewsQuery,
} from "@bookjeok/react-query";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type {
  ReviewFeed,
  ReviewReactionType as ReviewReaction,
} from "@bookjeok/core";

export const useReviewsQuery = (params: GetReviewsParams, enabled: boolean = true) =>
  useBaseReviewsQuery(params, publicAxios, enabled);

export const useReviewsInfiniteQuery = (params: GetReviewsParams, enabled: boolean = true) =>
  useBaseReviewsInfiniteQuery(params, publicAxios, enabled);

export const useReviewFeedsQuery = (enabled: boolean = true) =>
  useBaseReviewFeedsQuery(publicAxios, enabled);

export const usePopularReviewsQuery = (enabled: boolean = true) =>
  useBasePopularReviewsQuery(publicAxios, enabled);

export const useReviewDetailQuery = (id: number, initialData?: Review) =>
  useBaseReviewDetailQuery(id, publicAxios, initialData);

export const useReviewForEditQuery = (id: number) =>
  useBaseReviewForEditQuery(id, privateAxios);

export const useMyReviewReactionQuery = (id: number, enabled: boolean = true) =>
  useBaseMyReviewReactionQuery(id, privateAxios, enabled);

export const useRecommendedReviewsQuery = (id: number, enabled: boolean = true) =>
  useBaseRecommendedReviewsQuery(id, publicAxios, enabled);
