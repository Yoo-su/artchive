import { BookInfo, BookSearchField, BookSortParam } from '@bookjeok/core';

/**
 * 도서 서지 공급처 포트.
 *
 * 알라딘·국립중앙도서관·카카오처럼 언제든 갈아끼울 수 있는 바깥 세계를
 * 이 인터페이스 뒤로 숨깁니다. 공급처가 또 종료돼도 어댑터 하나만 추가하면
 * 되도록 하는 것이 목적입니다.
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
 * 공급처 체인 주입 토큰. 배열의 순서가 곧 조회 우선순위입니다.
 * 등록은 `book.module.ts` 한 곳에서만 합니다.
 */
export const BOOK_CATALOG_PROVIDERS = Symbol('BOOK_CATALOG_PROVIDERS');
