/**
 * React Query 캐시 시간 및 관련 상수
 * 애플리케이션 전반에서 일관된 캐싱 정책을 유지하기 위해 사용됩니다.
 */

export const CACHE_TIME = {
  /** 30초: 실시간성이 높거나 자주 확인해야 하는 개인 데이터 */
  THIRTY_SECONDS: 30 * 1000,

  /** 1분: 일반적인 자주 변경되는 데이터 */
  ONE_MINUTE: 60 * 1000,

  /** 5분: 통계, 랭킹, 인기 검색어 등 자주 변경되지 않지만 갱신이 필요한 데이터 */
  FIVE_MINUTES: 5 * 60 * 1000,

  /** 30분: 가비지 컬렉션(gcTime) 기본값 */
  THIRTY_MINUTES: 30 * 60 * 1000,

  /** 무한: 변경되지 않는 데이터 (예: 읽음 상태, 방 목록 요약 등 일부) */
  INFINITY: Infinity,
} as const;
