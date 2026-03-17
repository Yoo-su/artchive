"use client";

import { useQuery } from "@tanstack/react-query";

import { CACHE_TIME } from "@/shared/constants/cache";

import {
  checkWishlistStatus,
  getMyProfile,
  getPublicProfile,
  getUserStats,
  getWishlist,
} from "./apis";
import { userKeys } from "./constants/query-keys";
import { PublicUserProfile, WishlistItem } from "./types";

export interface UserStats {
  salesCount: number;
  salesStatusCounts: {
    FOR_SALE?: number;
    RESERVED?: number;
    SOLD?: number;
    WITHDRAWN?: number;
  };
  chatRoomCount: number;
  reviewsCount: number;
}

/**
 * 내 활동 통계 (내 데이터 - 짧은 staleTime)
 */
export const useMyStatsQuery = () => {
  return useQuery<UserStats>({
    queryKey: userKeys.stats.queryKey,
    queryFn: getUserStats,
    staleTime: CACHE_TIME.ONE_MINUTE,
  });
};

/**
 * 공개 사용자 프로필 조회
 */
export const usePublicProfileQuery = (
  handle: string,
  enabled: boolean = true,
) => {
  return useQuery<PublicUserProfile>({
    queryKey: userKeys.profile(handle).queryKey,
    queryFn: () => getPublicProfile(handle),
    enabled: enabled && !!handle,
  });
};

/**
 * 내 프로필 조회
 */
export const useMyProfileQuery = () => {
  return useQuery({
    queryKey: userKeys.me.queryKey,
    queryFn: getMyProfile,
  });
};

/**
 * 내 위시리스트 (내 데이터 - 짧은 staleTime)
 */
export const useWishlistQuery = () => {
  return useQuery<WishlistItem[]>({
    queryKey: userKeys.wishlist.queryKey,
    queryFn: getWishlist,
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 위시리스트 포함 여부 (내 데이터 - 짧은 staleTime)
 */
export const useWishlistStatusQuery = (
  type: "BOOK" | "SALE",
  id: string | number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: userKeys.wishlistCheck(type, id).queryKey,
    queryFn: () => checkWishlistStatus(type, id),
    enabled,
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};
