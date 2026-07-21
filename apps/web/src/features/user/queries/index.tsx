import { useMyProfileQuery as useBaseMyProfileQuery, useMyStatsQuery as useBaseMyStatsQuery, useMyWishlistQuery as useBaseWishlistQuery, usePublicUserProfileQuery as useBasePublicProfileQuery, useWishlistStatusQuery as useBaseWishlistStatusQuery } from "@bookjeok/react-query";

export type { UserStats } from "@bookjeok/core";

export const useMyProfileQuery = () => useBaseMyProfileQuery();
export const useMyStatsQuery = () => useBaseMyStatsQuery();
export const usePublicProfileQuery = (handle: string) => useBasePublicProfileQuery(handle);
export const useWishlistQuery = () => useBaseWishlistQuery();
export const useWishlistStatusQuery = (type: "BOOK" | "SALE", id: string | number, options?: { enabled?: boolean }) =>
  useBaseWishlistStatusQuery(type, id, options);
