import { BookInfo, BookSearchField } from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import {
  BookCatalogProvider,
  BookCatalogProviderKind,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from './book-catalog.types';

/** 검색 대상이 될 수 있는 `books` 컬럼. */
export type BookSearchColumn = 'title' | 'author' | 'publisher';

const COLUMNS_BY_FIELD: Record<BookSearchField, readonly BookSearchColumn[]> = {
  Title: ['title'],
  Author: ['author'],
  Publisher: ['publisher'],
  // 통합 검색. 배열 순서가 곧 관련도 우선순위다. relevanceCaseSql 참조.
  Keyword: ['title', 'author', 'publisher'],
};

/**
 * 검색 필드에 따라 조회할 컬럼을 반환합니다.
 * 이 값을 무시하면 출판사 검색(도서 상세의 같은 출판사 책, 홈 출판사 슬라이더)이
 * 자체 DB에서 항상 0건이 됩니다.
 * @param field 검색 필드
 * @returns 조회 대상 컬럼 목록 (우선순위 순)
 */
export function searchColumnsFor(
  field: BookSearchField,
): readonly BookSearchColumn[] {
  return COLUMNS_BY_FIELD[field] ?? COLUMNS_BY_FIELD.Keyword;
}

/**
 * 검색어의 %와 _가 ILIKE 와일드카드로 동작하지 않도록 이스케이프합니다.
 * Postgres의 LIKE 기본 이스케이프 문자가 백슬래시라 별도 ESCAPE 절은 필요 없습니다.
 * @param value 사용자 검색어
 * @returns 이스케이프된 검색어
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * 관련도 정렬용 CASE 식을 만듭니다. 값이 낮을수록 상위입니다.
 * 컬럼 우선순위 안에서 완전일치, 접두일치, 부분일치 순으로 순위를 매깁니다.
 * 알라딘의 Sort=Accuracy를 대신하는 부분입니다.
 * @param alias 테이블 별칭
 * @param columns 우선순위 순으로 정렬된 검색 대상 컬럼
 * @returns ORDER BY에 넣을 CASE 식
 */
export function relevanceCaseSql(
  alias: string,
  columns: readonly BookSearchColumn[],
): string {
  const branches: string[] = [];
  let rank = 0;

  for (const column of columns) {
    branches.push(`WHEN ${alias}.${column} ILIKE :exact THEN ${rank++}`);
    branches.push(`WHEN ${alias}.${column} ILIKE :prefix THEN ${rank++}`);
    branches.push(`WHEN ${alias}.${column} ILIKE :like THEN ${rank++}`);
  }

  return `CASE ${branches.join(' ')} ELSE ${rank} END`;
}

/**
 * 자체 DB 공급처 어댑터.
 *
 * 이미 적재된 `books`를 공급처처럼 다룹니다. 외부 공급처가 죽어도 우리가 가진
 * 도서는 계속 찾을 수 있게 하는 최후 방어선입니다.
 *
 * 상세 체인에서는 1순위입니다. ISBN이 PK라 인덱스 단건 조회입니다.
 * 2026-09-08에 알라딘 어댑터를 제거해 **두 체인의 유일한 공급처**가 되었습니다.
 * 검색 품질은 title·author·publisher의 pg_trgm GIN 인덱스와 아래 관련도 정렬이
 * 담당합니다. 체인 구성은 book.module.ts에서 정합니다.
 *
 * kind가 local인 이유는 이 어댑터의 결과 없음이 도서의 부재가 아니라 미확보를
 * 뜻하기 때문입니다. BookCatalogService가 장애와 도서 없음을 구분할 때 씁니다.
 */
@Injectable()
export class LocalDbBookCatalogProvider implements BookCatalogProvider {
  readonly name = 'local-db';
  readonly kind: BookCatalogProviderKind = 'local';

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  /**
   * 자체 DB에서 도서를 검색합니다.
   *
   * params.sort는 아직 사용하지 않습니다. `books.pubDate`는 2026-09-09에 값이
   * 채워졌으므로(커버리지 99.5%) 이제 sort='date'를 `pubDate DESC NULLS LAST`로
   * 연결할 수 있습니다. createdAt은 적재 시각이라 대신 쓸 수 없습니다.
   * @param params 검색 조건
   * @returns 정규화된 검색 결과
   */
  async search(
    params: BookCatalogSearchParams,
  ): Promise<BookCatalogSearchResult> {
    const { query, display, start, field } = params;
    // 공백만 있는 검색어를 통과시키면 ILIKE '% %'가 되어 공백이 든 모든 도서가
    // 매칭된다(실측 57,577행 / 카운트에만 3초). 빈 문자열 검사로는 못 막는다.
    const trimmed = query?.trim() ?? '';
    if (!trimmed) {
      return { total: 0, start, display, items: [] };
    }

    const columns = searchColumnsFor(field);
    const escaped = escapeLike(trimmed);

    const [books, total] = await this.bookRepository
      .createQueryBuilder('book')
      .where(columns.map((c) => `book.${c} ILIKE :like`).join(' OR '), {
        like: `%${escaped}%`,
        prefix: `${escaped}%`,
        exact: escaped,
      })
      // 정렬이 없으면 순서가 보장되지 않아 OFFSET 페이지네이션에서 중복과 누락이
      // 생긴다. isbn까지 걸어 순서를 확정한다.
      .orderBy(relevanceCaseSql('book', columns), 'ASC')
      // 같은 관련도 안에서는 판매지수로 가른다. 흔한 키워드는 대부분 한 버킷에
      // 뭉치므로("사랑" 제목 부분일치만 791건) 이 두 번째 키가 사실상 체감 순서를
      // 결정한다. 전에 쓰던 viewCount는 도서의 75%가 0이고 나머지도 크롤러 흔적이라
      // 스테디셀러가 오히려 바닥에 깔렸다. NULLS LAST로 미수확분을 뒤로 보낸다.
      .addOrderBy('book.salesPoint', 'DESC', 'NULLS LAST')
      .addOrderBy('book.isbn', 'ASC')
      .skip(Math.max(start - 1, 0))
      .take(display)
      .getManyAndCount();

    return {
      total,
      start,
      display,
      items: books.map((book) => this.toBookInfo(book)),
    };
  }

  async findByIsbn(isbn: string): Promise<BookInfo | null> {
    const book = await this.bookRepository.findOneBy({ isbn });
    return book ? this.toBookInfo(book) : null;
  }

  /** 엔티티를 서비스 표준 형태로 옮긴다. `link`는 자체 DB에 없으므로 비운다. */
  private toBookInfo(book: Book): BookInfo {
    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      description: book.description,
      image: book.image,
      discount: book.discount,
    };
  }
}
