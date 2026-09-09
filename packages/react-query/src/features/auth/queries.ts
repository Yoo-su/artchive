"use client";

import { getUserProfile } from "@bookjeok/api-client";
import { authKeys } from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";

/**
 * 현재 로그인한 사용자의 프로필 정보 조회
 */
export const useUserProfileQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: authKeys.user.queryKey,
    queryFn: () => getUserProfile(),
    enabled,
  });
};
