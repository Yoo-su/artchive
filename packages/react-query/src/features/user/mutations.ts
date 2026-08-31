"use client";
import { addToWishlist, removeFromWishlist, toggleWishlist, updateProfile, withdraw } from "@bookjeok/api-client";
import { PublicUserProfile, UpdateUserProfileParams, userKeys, WishlistItem } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 찜 토글 뮤테이션
 */
export const useToggleWishlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { isbn?: string; saleId?: number }) =>
      toggleWishlist(payload),
    onSuccess: (data, variables) => {
      // 찜 목록 무효화
      queryClient.invalidateQueries({ queryKey: userKeys.wishlist.queryKey });
      // 특정 아이템의 찜 상태 무효화
      queryClient.invalidateQueries({
        queryKey: userKeys.wishlistCheck(variables.isbn ? "BOOK" : "SALE", (variables.isbn || variables.saleId)!).queryKey,
      });
    },
  });
};

/**
 * 회원 탈퇴 뮤테이션
 */
export const useWithdrawMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  return useMutation({
    mutationFn: () => withdraw(),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 위시리스트 추가 뮤테이션
 */
export const useAddToWishlistMutation = (options?: { onSuccess?: (data: WishlistItem) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { type: "BOOK" | "SALE"; id: string | number }) => 
      addToWishlist(params.type, params.id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.wishlist.queryKey });
      queryClient.invalidateQueries({ queryKey: userKeys.wishlistCheck(variables.type, variables.id).queryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 위시리스트 제거 뮤테이션
 */
export const useRemoveFromWishlistMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { type: "BOOK" | "SALE"; id: string | number }) => 
      removeFromWishlist(params.type, params.id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.wishlist.queryKey });
      queryClient.invalidateQueries({ queryKey: userKeys.wishlistCheck(variables.type, variables.id).queryKey });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 사용자 프로필 수정 뮤테이션
 */
export const useUpdateUserMutation = (options?: { onSuccess?: (data: PublicUserProfile & { email: string; isReadingLogPublic: boolean }) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateUserProfileParams) => updateProfile(params),
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me.queryKey, (old: PublicUserProfile & { email: string; isReadingLogPublic: boolean } | undefined) => {
        if (!old) return data;
        return { ...old, ...data };
      });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};
