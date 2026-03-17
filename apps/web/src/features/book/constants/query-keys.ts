import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetBookListParams } from "../types";

/**
 * 도서 관련 쿼리 키 팩토리
 *
 * 중고책 판매(book-sale) 관련 키는 book-sale 모듈에서 관리합니다.
 * @see features/book-sale/constants/query-keys.ts
 */
export const bookKeys = createQueryKeys("book", {
  // 개별 값으로 구성하여 서버/클라이언트 간 키 일치 보장
  list: (params: GetBookListParams) => ({
    queryKey: [
      params.query,
      params.display ?? 10,
      params.start ?? 1,
      params.sort ?? "sim",
    ],
  }),
  detail: (isbn: string) => ({
    queryKey: [isbn],
  }),
  search: (query: string) => ({
    queryKey: [query],
  }),
  popularBooks: {
    queryKey: null,
  },
  popularKeywords: {
    queryKey: null,
  },
});
