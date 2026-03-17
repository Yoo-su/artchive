"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { User } from "@/features/auth/types";
import { useRouter } from "@/shared/config/i18n/routing";
import { privateAxios } from "@/shared/libs/axios";
import { handleMutationError } from "@/shared/utils/error-handler";

import { BookInfo } from "../book/types";
import {
  addToWishlist,
  removeFromWishlist,
  updateProfile,
  UpdateUserProfileParams,
} from "./apis";
import { userKeys } from "./constants/query-keys";

/**
 * 회원 탈퇴를 처리하는 뮤테이션 훅입니다.
 * 탈퇴 성공 시 로그아웃 처리하고 홈으로 이동합니다.
 */
export const useWithdrawMutation = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      const response = await privateAxios.delete("/user/me");
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.",
      );
      clearAuth();
      location.href = "/";
    },
    onError: (error) => {
      handleMutationError(error, "회원 탈퇴");
    },
  });
};

/**
 * 위시리스트에 추가하는 뮤테이션 훅입니다.
 * 성공 시 위시리스트 목록과 해당 아이템의 상태를 무효화합니다.
 */
export const useAddToWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
      bookData,
    }: {
      type: "BOOK" | "SALE";
      id: string | number;
      bookData?: BookInfo;
    }) => addToWishlist(type, id, bookData),
    onSuccess: (_, variables) => {
      // 위시리스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: userKeys.wishlist.queryKey,
      });
      // 해당 아이템의 위시리스트 상태 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: userKeys.wishlistCheck(variables.type, variables.id).queryKey,
      });
    },
  });
};

/**
 * 위시리스트에서 제거하는 뮤테이션 훅입니다.
 * 성공 시 위시리스트 목록과 해당 아이템의 상태를 무효화합니다.
 */
export const useRemoveFromWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      id,
    }: {
      type: "BOOK" | "SALE";
      id: string | number;
    }) => removeFromWishlist(type, id),
    onSuccess: (_, variables) => {
      // 위시리스트 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: userKeys.wishlist.queryKey,
      });
      // 해당 아이템의 위시리스트 상태 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: userKeys.wishlistCheck(variables.type, variables.id).queryKey,
      });
    },
  });
};

/**
 * 사용자 프로필 업데이트 뮤테이션
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateUserProfileParams) => updateProfile(params),
    onSuccess: (data) => {
      // 내 프로필 쿼리 무효화 (또는 업데이트된 데이터로 setQueryData)
      toast.success("프로필이 업데이트되었습니다.");

      // 내 프로필 캐시 업데이트
      queryClient.setQueryData(
        userKeys.me.queryKey,
        (oldData: User | undefined) => {
          if (!oldData) return data;
          return { ...oldData, ...data };
        },
      );
    },
    onError: (error) => {
      handleMutationError(error, "프로필 수정");
    },
  });
};
