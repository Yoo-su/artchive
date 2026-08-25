"use client";

import { ReviewFormValues } from "@bookjeok/core";
import { useCreateReviewMutation as useSharedCreateReviewMutation, useDeleteReviewMutation as useSharedDeleteReviewMutation, useToggleReviewReactionMutation as useSharedToggleReviewReactionMutation, useUpdateReviewMutation as useSharedUpdateReviewMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { deleteImages } from "@/features/book-sale/actions/delete-action";
import { handleMutationError } from "@/shared/utils/error-handler";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 */
export const useToggleReviewReactionMutation = (reviewId: number) => {
  return useSharedToggleReviewReactionMutation(reviewId);
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = () => {
  const t = useTranslations("review.toast");
  return useSharedCreateReviewMutation({
    onSuccess: () => {
      toast.success(t("create_success"));
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = () => {
  const t = useTranslations("review.toast");
  const sharedMutation = useSharedUpdateReviewMutation({
    onSuccess: () => {
      toast.success(t("update_success"));
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({
      id,
      data,
      deletedImageUrls,
    }: {
      id: number;
      data: ReviewFormValues;
      deletedImageUrls?: string[];
    }) => {
      if (deletedImageUrls && deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }
      return sharedMutation.mutate({ id, data });
    },
    mutateAsync: async ({
      id,
      data,
      deletedImageUrls,
    }: {
      id: number;
      data: ReviewFormValues;
      deletedImageUrls?: string[];
    }) => {
      if (deletedImageUrls && deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }
      return sharedMutation.mutateAsync({ id, data });
    },
  };
};

/**
 * 리뷰를 삭제하는 뮤테이션 훅입니다.
 */
export const useDeleteReviewMutation = () => {
  const t = useTranslations("review.toast");
  return useSharedDeleteReviewMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
  });
};
