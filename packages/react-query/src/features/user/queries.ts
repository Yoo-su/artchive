"use client";
import { checkWishlistStatus, getMyProfile,getMyWishlist, getPublicUserProfile, getUserStats, toggleWishlist } from "@bookjeok/api-client";
import { userKeys } from "@bookjeok/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 특정 사용자의 공개 프로필 조회
 */
export const usePublicUserProfileQuery = (handle: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: userKeys.publicProfile(handle).queryKey,
    queryFn: () => getPublicUserProfile(client, handle),
    enabled: !!handle,
  });
};

/**
 * 내 찜 목록 조회
 */
export const useMyWishlistQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: userKeys.wishlist.queryKey,
    queryFn: () => getMyWishlist(client),
  });
};

/**
 * 찜 토글 뮤테이션
 */
export const useToggleWishlistMutation = (client: AxiosInstance) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { isbn?: string; saleId?: number }) =>
      toggleWishlist(client, payload),
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
 * 위시리스트 포함 여부 조회
 */
export const useWishlistStatusQuery = (
  type: "BOOK" | "SALE",
  id: string | number,
  client: AxiosInstance,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: userKeys.wishlistCheck(type, id).queryKey,
    queryFn: () => checkWishlistStatus(client, type, id),
    enabled: options?.enabled,
  });
};

/**
 * 내 활동 통계 조회 (내 데이터 - 짧은 staleTime)
 */
export const useMyStatsQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: userKeys.stats.queryKey,
    queryFn: () => getUserStats(client),
    staleTime: 60 * 1000, // 1분
  });
};

/**
 * 내 프로필 조회
 */
export const useMyProfileQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: userKeys.me.queryKey,
    queryFn: () => getMyProfile(client),
  });
};
