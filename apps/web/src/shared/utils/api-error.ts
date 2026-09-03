import axios from "axios";

/**
 * 리소스 부재(404)와 일시적 API 장애(5xx·네트워크·타임아웃) 판별
 * - ISR 캐시 대상 페이지에서 장애를 404로 처리하면 revalidate 기간 내내 404가 고착
 * - 404만 삼키고 나머지는 재던져 에러 바운더리로 위임 (에러 응답은 ISR 캐시에 미저장)
 * @param error catch로 잡은 예외
 */
export const isNotFoundError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404;
