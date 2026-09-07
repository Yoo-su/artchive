import { BookInfo, BookSearchField, BookSortParam } from '@bookjeok/core';

/**
 * 도서 서지 공급처 포트.
 *
 * 언제든 갈아끼울 수 있는 바깥 세계를 이 인터페이스 뒤로 숨깁니다.
 * 네이버·알라딘이 연달아 종료된 경험 때문에, 공급처가 또 끊겨도 어댑터
 * 하나만 추가하면 되도록 하는 것이 목적입니다.
 *
 * 구현체는 **공급처 고유 응답 구조를 밖으로 내보내지 않습니다.** 반환값은 항상
 * `@bookjeok/core`의 `BookInfo`로 정규화합니다.
 */
export interface BookCatalogProvider {
  /** 로그와 장애 추적에 쓰는 공급처 이름. */
  readonly name: string;

  search(params: BookCatalogSearchParams): Promise<BookCatalogSearchResult>;

  findByIsbn(isbn: string): Promise<BookInfo | null>;
}

export interface BookCatalogSearchParams {
  query: string;
  display: number;
  start: number;
  sort: BookSortParam;
  field: BookSearchField;
}

export interface BookCatalogSearchResult {
  total: number;
  start: number;
  display: number;
  items: BookInfo[];
}

/**
 * 검색(키워드) 공급처 체인 주입 토큰. 배열의 순서가 곧 조회 우선순위입니다.
 * 등록은 `book.module.ts` 한 곳에서만 합니다.
 */
export const BOOK_SEARCH_PROVIDERS = Symbol('BOOK_SEARCH_PROVIDERS');

/**
 * 상세(ISBN 단건) 공급처 체인 주입 토큰.
 *
 * **검색과 순서가 다릅니다.** 상세는 ISBN이 PK라 자체 DB 조회가 인덱스 단건이고,
 * 검색은 인덱스가 없어 풀스캔입니다. 하나의 체인으로 묶으면 둘 중 하나가
 * 반드시 손해를 보므로 경로를 나눕니다. 근거는 `book.module.ts`에 적어 둡니다.
 */
export const BOOK_DETAIL_PROVIDERS = Symbol('BOOK_DETAIL_PROVIDERS');
