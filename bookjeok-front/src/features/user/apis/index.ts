import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

import { BookInfo } from "../../book/types";
import { UserStats } from "../queries";
import { PublicUserProfile, WishlistItem } from "../types";

/**
 * 사용자의 활동 통계(판매, 채팅, 리뷰 수 등)를 조회합니다.
 * @returns 사용자 통계 정보
 */
export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await privateAxios.get<UserStats>(API_PATHS.user.stats);
  return data;
};

/**
 * 공개 사용자 프로필을 조회합니다.
 * @param userId 사용자 ID
 * @returns 공개 프로필 정보
 */
export const getPublicProfile = async (
  handle: string,
): Promise<PublicUserProfile> => {
  const { data } = await publicAxios.get<PublicUserProfile>(
    API_PATHS.user.publicProfile(handle),
  );
  return data;
};

/**
 * 내 프로필 정보를 조회합니다.
 * @returns 내 프로필 정보
 */
export const getMyProfile = async () => {
  const { data } = await privateAxios.get<
    PublicUserProfile & { email: string; isReadingLogPublic: boolean }
  >(API_PATHS.user.profile);
  return data;
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
  const { data } = await privateAxios.patch(API_PATHS.user.base, params);
  return data;
};

/**
 * 위시리스트에 항목을 추가합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @param bookData 책 정보 (책이 DB에 없을 경우 생성용)
 * @returns 추가된 위시리스트 항목
 */
export const addToWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
  bookData?: BookInfo,
) => {
  const { data } = await privateAxios.post(API_PATHS.user.wishlist, {
    type,
    id,
    bookData,
  });
  return data;
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
  const { data } = await privateAxios.delete(API_PATHS.user.wishlist, {
    params: { type, id },
  });
  return data;
};

/**
 * 내 위시리스트 목록을 조회합니다.
 * @returns 위시리스트 목록
 */
export const getWishlist = async () => {
  const { data } = await privateAxios.get<WishlistItem[]>(
    API_PATHS.user.wishlist,
  );
  return data;
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
  const { data } = await privateAxios.get<{ isWishlisted: boolean }>(
    API_PATHS.user.wishlistCheck,
    {
      params: { type, id },
    },
  );
  return data;
};
