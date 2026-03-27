/**
 * 공통 API 응답 타입 정의
 * @template T - 실제 데이터 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * 공통 페이지네이션 응답 타입 정의
 * @template T - 개별 항목 타입
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
