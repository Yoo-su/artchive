"use client";

import { ReviewFormValues } from "@bookjeok/core";
import { useCreateReviewMutation as useSharedCreateReviewMutation, useDeleteReviewMutation as useSharedDeleteReviewMutation, useToggleReviewReactionMutation as useSharedToggleReviewReactionMutation, useUpdateReviewMutation as useSharedUpdateReviewMutation } from "@bookjeok/react-query";
import { toast } from "sonner";

import { deleteImages } from "@/features/book-sale/actions/delete-action";
import { privateAxios } from "@/shared/libs/axios";
import { handleMutationError } from "@/shared/utils/error-handler";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 */
export const useToggleReviewReactionMutation = (reviewId: number) => {
  return useSharedToggleReviewReactionMutation(reviewId, privateAxios);
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = () => {
  return useSharedCreateReviewMutation(privateAxios, {
    onSuccess: () => {
      toast.success("리뷰가 작성되었습니다.");
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = () => {
  const sharedMutation = useSharedUpdateReviewMutation(privateAxios, {
    onSuccess: () => {
      toast.success("리뷰가 수정되었습니다!");
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
  return useSharedDeleteReviewMutation(privateAxios, {
    onSuccess: () => {
      toast.success("리뷰가 삭제되었습니다.");
    },
  });
};
