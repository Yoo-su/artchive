import { getUserProfile } from "@bookjeok/api-client/auth";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { authKeys } from "./query-keys";

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
