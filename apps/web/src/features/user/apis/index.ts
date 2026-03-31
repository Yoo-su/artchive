import { addToWishlist as sharedAddToWishlist, checkNickname as sharedCheckNickname, checkWishlistStatus as sharedCheckWishlistStatus, getMyProfile as sharedGetMyProfile, getMyWishlist as sharedGetMyWishlist, getPublicUserProfile as sharedGetPublicUserProfile, getUserStats as sharedGetUserStats, removeFromWishlist as sharedRemoveFromWishlist, updateProfile as sharedUpdateProfile } from "@bookjeok/api-client";
import { PublicUserProfile, UserStats, WishlistItem } from "@bookjeok/core";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

/**
 * 사용자의 활동 통계(판매, 채팅, 리뷰 수 등)를 조회합니다.
 * @returns 사용자 통계 정보
 */
export const getUserStats = async (): Promise<UserStats> => {
  return sharedGetUserStats(privateAxios);
};

/**
 * 공개 사용자 프로필을 조회합니다.
 * @param handle 사용자 핸들
 * @returns 공개 프로필 정보
 */
export const getPublicProfile = async (
  handle: string,
): Promise<PublicUserProfile> => {
  return sharedGetPublicUserProfile(publicAxios, handle);
};

/**
 * 내 프로필 정보를 조회합니다.
 * @returns 내 프로필 정보
 */
export const getMyProfile = async () => {
  return sharedGetMyProfile(privateAxios);
};

export interface UpdateUserProfileParams {
  nickname?: string;
  profileImageUrl?: string;
}

/**
 * 내 프로필 정보를 수정합니다.
 * @param params 수정할 프로필 정보
 * @returns 수정된 사용자 정보
 */
export const updateProfile = async (params: UpdateUserProfileParams) => {
  return sharedUpdateProfile(privateAxios, params);
};

/**
 * 닉네임 사용 가능 여부를 확인합니다.
 * @param nickname 확인할 닉네임
 * @returns 사용 가능 여부
 */
export const checkNickname = async (
  nickname: string,
 ): Promise<{ available: boolean }> => {
  return sharedCheckNickname(privateAxios, nickname);
};

/**
 * 위시리스트에 항목을 추가합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @returns 추가된 위시리스트 항목
 */
export const addToWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
) => {
  return sharedAddToWishlist(privateAxios, type, id);
};

/**
 * 위시리스트에서 항목을 제거합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @returns 제거된 항목
 */
export const removeFromWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
) => {
  return sharedRemoveFromWishlist(privateAxios, type, id);
};

/**
 * 내 위시리스트 목록을 조회합니다.
 * @returns 위시리스트 목록
 */
export const getWishlist = async () => {
  return sharedGetMyWishlist(privateAxios);
};

/**
 * 특정 항목이 위시리스트에 있는지 확인합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @returns 위시리스트 포함 여부
 */
export const checkWishlistStatus = async (
  type: "BOOK" | "SALE",
  id: string | number,
) => {
  return sharedCheckWishlistStatus(privateAxios, type, id);
};
