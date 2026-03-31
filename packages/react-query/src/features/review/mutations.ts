"use client";
import { createReview, deleteReview, toggleReviewReaction, updateReview } from "@bookjeok/api-client";
import { Review, ReviewFormValues, reviewKeys, reviewMutationKeys, ReviewReactionType } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 */
export const useToggleReviewReactionMutation = (reviewId: number, client: AxiosInstance, options?: { onSuccess?: (data: Review) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reviewMutationKeys.toggleReaction(reviewId),
    mutationFn: (type: ReviewReactionType) =>
      toggleReviewReaction(client, reviewId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({
        queryKey: reviewKeys.detail(reviewId).queryKey,
      });
      await queryClient.cancelQueries({
        queryKey: [...reviewKeys.detail(reviewId).queryKey, "reaction"],
      });

      const previousReview = queryClient.getQueryData<Review>(
        reviewKeys.detail(reviewId).queryKey,
      );
      const previousMyReaction =
        queryClient.getQueryData<ReviewReactionType | null>([
          ...reviewKeys.detail(reviewId).queryKey,
          "reaction",
        ]);

      if (previousReview) {
        const isSameReaction = previousMyReaction === type;
        const newMyReaction = isSameReaction ? null : type;

        const newReactionCounts = {
          ...(previousReview.reactionCounts || {
            [ReviewReactionType.LIKE]: 0,
            [ReviewReactionType.INSIGHTFUL]: 0,
            [ReviewReactionType.SUPPORT]: 0,
          }),
        };

        if (previousMyReaction) {
          newReactionCounts[previousMyReaction] = Math.max(
            0,
            newReactionCounts[previousMyReaction] - 1,
          );
        }

        if (newMyReaction) {
          newReactionCounts[newMyReaction] =
            (newReactionCounts[newMyReaction] || 0) + 1;
        }

        queryClient.setQueryData(reviewKeys.detail(reviewId).queryKey, {
          ...previousReview,
          reactionCounts: newReactionCounts,
        });
        queryClient.setQueryData(
          [...reviewKeys.detail(reviewId).queryKey, "reaction"],
          newMyReaction,
        );
      }

      return { previousReview, previousMyReaction };
    },
    onError: (err, _newReaction, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(
          reviewKeys.detail(reviewId).queryKey,
          context.previousReview,
        );
      }
      if (context?.previousMyReaction !== undefined) {
        queryClient.setQueryData(
          [...reviewKeys.detail(reviewId).queryKey, "reaction"],
          context.previousMyReaction,
        );
      }
      options?.onError?.(err);
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
  });
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = (client: AxiosInstance, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewFormValues) => createReview(client, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      options?.onSuccess?.();
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = (client: AxiosInstance, options?: { onSuccess?: (data: Review) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewFormValues }) =>
      updateReview(client, id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(data.id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.popular.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.recommend(data.id).queryKey,
      });

      options?.onSuccess?.(data);
    },
  });
};

/**
 * 리뷰를 삭제하는 뮤테이션 훅입니다.
 */
export const useDeleteReviewMutation = (client: AxiosInstance, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteReview(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.popular.queryKey,
      });
      options?.onSuccess?.();
    },
  });
};
