"use client";

import { ReviewFormValues } from "@bookjeok/core";
import { useCreateReviewMutation as useSharedCreateReviewMutation, useDeleteReviewMutation as useSharedDeleteReviewMutation, useToggleReviewReactionMutation as useSharedToggleReviewReactionMutation, useUpdateReviewMutation as useSharedUpdateReviewMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { deleteImages } from "@/features/book-sale/actions/delete-action";
import { revalidateReview } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

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
  const router = useRouter();

  return useSharedCreateReviewMutation({
    onSuccess: () => {
      toast.success(t("create_success"));
      // 새 리뷰가 실릴 목록 · 홈의 ISR 캐시와 브라우저 Router Cache를 함께 비운다.
      void purgeRouteCache(revalidateReview({}), () => router.refresh());
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = () => {
  const t = useTranslations("review.toast");
  const router = useRouter();

  const sharedMutation = useSharedUpdateReviewMutation({
    onSuccess: (data) => {
      toast.success(t("update_success"));
      void purgeRouteCache(revalidateReview({ reviewId: data.id }), () =>
        router.refresh(),
      );
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
  const router = useRouter();

  return useSharedDeleteReviewMutation({
    onSuccess: (id: number) => {
      toast.success(t("delete_success"));
      // 삭제된 리뷰의 상세 페이지가 ISR 캐시에 200으로 남아 있으면
      // 다른 방문자와 크롤러에게 계속 노출된다.
      void purgeRouteCache(revalidateReview({ reviewId: id }), () =>
        router.refresh(),
      );
    },
  });
};
