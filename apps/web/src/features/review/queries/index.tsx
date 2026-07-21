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

export type {
  ReviewFeed,
  ReviewReactionType as ReviewReaction,
} from "@bookjeok/core";

export const useReviewsQuery = (params: GetReviewsParams, enabled: boolean = true) =>
  useBaseReviewsQuery(params, enabled);

export const useReviewsInfiniteQuery = (params: GetReviewsParams, enabled: boolean = true) =>
  useBaseReviewsInfiniteQuery(params, enabled);

export const useReviewFeedsQuery = (enabled: boolean = true) =>
  useBaseReviewFeedsQuery(enabled);

export const usePopularReviewsQuery = (enabled: boolean = true) =>
  useBasePopularReviewsQuery(enabled);

export const useReviewDetailQuery = (id: number, initialData?: Review) =>
  useBaseReviewDetailQuery(id, initialData);

export const useReviewForEditQuery = (id: number) =>
  useBaseReviewForEditQuery(id);

export const useMyReviewReactionQuery = (id: number, enabled: boolean = true) =>
  useBaseMyReviewReactionQuery(id, enabled);

export const useRecommendedReviewsQuery = (id: number, enabled: boolean = true) =>
  useBaseRecommendedReviewsQuery(id, enabled);
