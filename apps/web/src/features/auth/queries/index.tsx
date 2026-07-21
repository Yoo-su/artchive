import { useUserProfileQuery as useBaseUserProfileQuery } from "@bookjeok/react-query";

/**
 * 현재 로그인한 사용자의 프로필 정보 조회 (인증 필요)
 */
export const useUserProfileQuery = (enabled: boolean = true) =>
  useBaseUserProfileQuery(enabled);
