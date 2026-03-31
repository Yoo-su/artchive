import { getUserProfile } from "@bookjeok/api-client";
import { authKeys } from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 현재 로그인한 사용자의 프로필 정보 조회
 */
export const useUserProfileQuery = (
  client: AxiosInstance,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: authKeys.user.queryKey,
    queryFn: () => getUserProfile(client),
    enabled,
  });
};
