import { useMyProfileQuery as useBaseMyProfileQuery, useMyStatsQuery as useBaseMyStatsQuery, useMyWishlistQuery as useBaseWishlistQuery, usePublicUserProfileQuery as useBasePublicProfileQuery, useWishlistStatusQuery as useBaseWishlistStatusQuery } from "@bookjeok/react-query";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type { UserStats } from "@bookjeok/core";

export const useMyProfileQuery = () => useBaseMyProfileQuery(privateAxios);
export const useMyStatsQuery = () => useBaseMyStatsQuery(privateAxios);
export const usePublicProfileQuery = (handle: string) => useBasePublicProfileQuery(handle, publicAxios);
export const useWishlistQuery = () => useBaseWishlistQuery(privateAxios);
export const useWishlistStatusQuery = (type: "BOOK" | "SALE", id: string | number, options?: { enabled?: boolean }) =>
  useBaseWishlistStatusQuery(type, id, privateAxios, options);
