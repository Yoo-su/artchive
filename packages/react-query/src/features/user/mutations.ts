"use client";
import { addToWishlist, removeFromWishlist, updateProfile,withdraw } from "@bookjeok/api-client";
import { PublicUserProfile, UpdateUserProfileParams, userKeys, WishlistItem } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 회원 탈퇴 뮤테이션
 */
export const useWithdrawMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  return useMutation({
    mutationFn: () => withdraw(client),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 위시리스트 추가 뮤테이션
 */
export const useAddToWishlistMutation = (client: AxiosInstance, options?: { onSuccess?: (data: WishlistItem) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { type: "BOOK" | "SALE"; id: string | number }) => 
      addToWishlist(client, params.type, params.id),
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
export const useRemoveFromWishlistMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { type: "BOOK" | "SALE"; id: string | number }) => 
      removeFromWishlist(client, params.type, params.id),
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
export const useUpdateUserMutation = (client: AxiosInstance, options?: { onSuccess?: (data: PublicUserProfile & { email: string; isReadingLogPublic: boolean }) => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateUserProfileParams) => updateProfile(client, params),
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
