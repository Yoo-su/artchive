/**
 * 공통 API 응답 타입 정의
 *
 * @template T - 실제 데이터 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}
