import { BookInfo } from '@bookjeok/core';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  BOOK_CATALOG_PROVIDERS,
  BookCatalogProvider,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from '../providers/book-catalog.types';

const DEFAULT_DISPLAY = 10;
const DEFAULT_START = 1;

/**
 * 도서 서지 조회의 단일 진입점.
 *
 * 등록된 공급처를 순서대로 시도합니다. 한 공급처가 던지면 로그를 남기고 다음으로
 * 넘어가므로, 공급처 하나가 죽어도 조회 전체가 죽지는 않습니다.
 *
 * 컨트롤러와 `BookService`는 이 서비스만 알면 됩니다. 공급처가 바뀔 때
 * 손대는 곳은 `book.module.ts`의 등록 순서 하나입니다.
 */
@Injectable()
export class BookCatalogService {
  private readonly logger = new Logger(BookCatalogService.name);

  constructor(
    @Inject(BOOK_CATALOG_PROVIDERS)
    private readonly providers: BookCatalogProvider[],
  ) {}

  async search(
    params: Partial<BookCatalogSearchParams> & { query: string },
  ): Promise<BookCatalogSearchResult & { lastBuildDate: string }> {
    const normalized: BookCatalogSearchParams = {
      query: params.query,
      display: Number(params.display) || DEFAULT_DISPLAY,
      start: Number(params.start) || DEFAULT_START,
      sort: params.sort ?? 'sim',
      field: params.field ?? 'Keyword',
    };

    const result = await this.runChain(
      (provider) => provider.search(normalized),
      (value) => value.items.length > 0,
      {
        total: 0,
        start: normalized.start,
        display: normalized.display,
        items: [],
      },
      `검색(${normalized.query})`,
    );

    return { ...result, lastBuildDate: new Date().toISOString() };
  }

  async findByIsbn(isbn: string): Promise<BookInfo | null> {
    return await this.runChain(
      (provider) => provider.findByIsbn(isbn),
      (value) => value !== null,
      null,
      `상세(${isbn})`,
    );
  }

  /**
   * 공급처를 순서대로 시도하고 처음으로 쓸 만한 결과를 돌려준다.
   *
   * 모든 공급처가 예외로 끝났을 때만 던진다. 하나라도 정상 응답했다면 그건
   * 장애가 아니라 "책이 없다"는 사실이므로 빈 결과를 돌려준다. 반대로 전부
   * 터졌는데 빈 결과를 주면 장애가 "책 없음"으로 둔갑해 잘못된 404가 캐시에
   * 고착된다.
   */
  private async runChain<T>(
    call: (provider: BookCatalogProvider) => Promise<T>,
    isUsable: (value: T) => boolean,
    emptyValue: T,
    context: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    let anyResponded = false;

    for (const provider of this.providers) {
      try {
        const value = await call(provider);
        anyResponded = true;
        if (isUsable(value)) return value;
        this.logger.debug(`${provider.name} 결과 없음 — ${context}`);
      } catch (error) {
        // 원본 예외 종류(HttpException 등)는 그대로 살려 상위 처리에 맡긴다.
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `${provider.name} 실패 — ${context}: ${lastError.message}`,
        );
      }
    }

    if (!anyResponded && lastError !== null) throw lastError;

    return emptyValue;
  }
}
