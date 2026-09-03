"use client";
import { checkWishlistStatus, getMyProfile, getMyWishlist, getPublicUserProfile, getUserStats } from "@bookjeok/api-client";
import { userKeys } from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";

/**
 * 특정 사용자의 공개 프로필 조회
 */
export const usePublicUserProfileQuery = (handle: string) => {
  return useQuery({
    queryKey: userKeys.publicProfile(handle).queryKey,
    queryFn: () => getPublicUserProfile(handle),
    enabled: !!handle,
    // ISR(10분) 캐시 HTML 교정용
    // - 전역 기본값(staleTime: Infinity, refetchOnMount: false)이면 프로필이 영구 미갱신
    staleTime: 0,
    refetchOnMount: true,
  });
};

/**
 * 내 찜 목록 조회
 */
export const useMyWishlistQuery = () => {
  return useQuery({
    queryKey: userKeys.wishlist.queryKey,
    queryFn: () => getMyWishlist(),
  });
};

/**
 * 위시리스트 포함 여부 조회
 */
export const useWishlistStatusQuery = (
  type: "BOOK" | "SALE",
  id: string | number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: userKeys.wishlistCheck(type, id).queryKey,
    queryFn: () => checkWishlistStatus(type, id),
    enabled: options?.enabled,
  });
};

/**
 * 내 활동 통계 조회 (내 데이터 - 짧은 staleTime)
 */
export const useMyStatsQuery = () => {
  return useQuery({
    queryKey: userKeys.stats.queryKey,
    queryFn: () => getUserStats(),
    staleTime: 60 * 1000, // 1분
  });
};

/**
 * 내 프로필 조회
 */
export const useMyProfileQuery = () => {
  return useQuery({
    queryKey: userKeys.me.queryKey,
    queryFn: () => getMyProfile(),
  });
};
