import { useAddToWishlistMutation as useSharedAddToWishlistMutation, useRemoveFromWishlistMutation as useSharedRemoveFromWishlistMutation, useUpdateUserMutation as useSharedUpdateUserMutation, useWithdrawMutation as useSharedWithdrawMutation } from "@bookjeok/react-query/user";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { privateAxios } from "@/shared/libs/axios";
import { handleMutationError } from "@/shared/utils/error-handler";

/**
 * 위시리스트 추가 뮤테이션 훅
 */
export const useAddToWishlistMutation = () => {
  return useSharedAddToWishlistMutation(privateAxios, {
    onSuccess: () => {
      toast.success("위시리스트에 추가되었습니다.");
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
  return useSharedRemoveFromWishlistMutation(privateAxios, {
    onSuccess: () => {
      toast.success("위시리스트에서 삭제되었습니다.");
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
  return useSharedUpdateUserMutation(privateAxios, {
    onSuccess: () => {
      toast.success("회원 정보가 수정되었습니다.");
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
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useSharedWithdrawMutation(privateAxios, {
    onSuccess: () => {
      toast.success(
        "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.",
      );
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
