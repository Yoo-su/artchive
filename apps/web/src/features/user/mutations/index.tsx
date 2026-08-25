"use client";

import { useAddToWishlistMutation as useSharedAddToWishlistMutation, useRemoveFromWishlistMutation as useSharedRemoveFromWishlistMutation, useUpdateUserMutation as useSharedUpdateUserMutation, useWithdrawMutation as useSharedWithdrawMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { handleMutationError } from "@/shared/utils/error-handler";

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
  return useSharedUpdateUserMutation({
    onSuccess: () => {
      toast.success(t("update_success"));
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
