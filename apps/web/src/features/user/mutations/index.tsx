"use client";

import {
  useAddToWishlistMutation as useSharedAddToWishlistMutation,
  useRemoveFromWishlistMutation as useSharedRemoveFromWishlistMutation,
  useUpdateUserMutation as useSharedUpdateUserMutation,
  useWithdrawMutation as useSharedWithdrawMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { revalidateUserProfile } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

/**
 * 위시리스트 추가 뮤테이션 훅
 */
export const useAddToWishlistMutation = () => {
  const t = useTranslations("wishlist.toast");
  return useSharedAddToWishlistMutation({
    onSuccess: () => {
      toast.success(t("add_success"));
    },
    onError: (error: unknown) => {
      handleMutationError(error, "위시리스트 추가");
    },
  });
};

/**
 * 위시리스트 삭제 뮤테이션 훅
 */
export const useRemoveFromWishlistMutation = () => {
  const t = useTranslations("wishlist.toast");
  return useSharedRemoveFromWishlistMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: (error: unknown) => {
      handleMutationError(error, "위시리스트 삭제");
    },
  });
};

/**
 * 사용자 정보 업데이트 뮤테이션 훅
 */
export const useUpdateUserMutation = () => {
  const t = useTranslations("user_profile.toast");
  const router = useRouter();

  return useSharedUpdateUserMutation({
    // 공개 프로필은 10분 ISR이라 쿼리 무효화만으로는 다른 방문자·크롤러에 닿지 않는다
    onSuccess: (data) => {
      toast.success(t("update_success"));
      void purgeRouteCache(revalidateUserProfile({ handle: data.handle }), () =>
        router.refresh(),
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "회원 정보 수정");
    },
  });
};

/**
 * 회원 탈퇴를 처리하는 뮤테이션 훅입니다.
 */
export const useWithdrawMutation = () => {
  const t = useTranslations("user_profile.toast");
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useSharedWithdrawMutation({
    onSuccess: () => {
      toast.success(t("withdraw_success"));
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
    onError: (error: unknown) => {
      handleMutationError(error, "회원 탈퇴");
    },
  });
};
