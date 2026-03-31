import { createQueryKeys } from "@lukemorales/query-key-factory";

/**
 * 인증 관련 쿼리 키 팩토리
 */
export const authKeys = createQueryKeys("auth", {
  user: ["info"],
});
