import { BookInfo } from '@bookjeok/core';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
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
 * **검색과 상세는 체인이 다릅니다.** 같은 공급처라도 경로에 따라 유불리가
 * 반대라서 그렇습니다. 순서의 근거는 `book.module.ts`에 있습니다.
 *
 * 컨트롤러와 `BookService`는 이 서비스만 알면 됩니다. 공급처가 바뀔 때
 * 손대는 곳은 `book.module.ts`의 등록 순서 하나입니다.
 */
@Injectable()
export class BookCatalogService {
  private readonly logger = new Logger(BookCatalogService.name);

  constructor(
    @Inject(BOOK_SEARCH_PROVIDERS)
    private readonly searchProviders: BookCatalogProvider[],
    @Inject(BOOK_DETAIL_PROVIDERS)
    private readonly detailProviders: BookCatalogProvider[],
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
      this.searchProviders,
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
      this.detailProviders,
      (provider) => provider.findByIsbn(isbn),
      (value) => value !== null,
      null,
      `상세(${isbn})`,
    );
  }

  /**
   * 공급처를 순서대로 시도하고 처음으로 쓸 만한 결과를 돌려준다.
   *
   * **빈 결과를 "책 없음"이라는 사실로 인정하려면, 그렇게 판정할 자격이 있는
   * 공급처가 최소 하나는 정상 응답해야 한다.** 아무도 응답하지 못했다면 그건
   * 장애이므로 예외를 전파한다. 여기서 빈 결과를 돌려주면 장애가 404로 둔갑해
   * ISR 캐시에 24시간 고착된다.
   *
   * 판정 자격은 **외부 공급처에만** 있다. 자체 DB의 "못 찾음"은 "그런 책이
   * 없다"가 아니라 "우리가 아직 안 가졌다"일 뿐이기 때문이다. 자체 DB는 거의
   * 던지지 않으므로, 이걸 판정에 포함하면 외부가 전부 죽어도 늘 "책 없음"이
   * 되어 위 보호장치가 통째로 무력해진다.
   *
   * 외부 공급처가 하나도 등록돼 있지 않은 구성(자체 DB 단독)에서는 자체 DB가
   * 그 자격을 대신한다. 그 구성에서는 우리가 가진 것이 곧 전부다.
   */
  private async runChain<T>(
    providers: BookCatalogProvider[],
    call: (provider: BookCatalogProvider) => Promise<T>,
    isUsable: (value: T) => boolean,
    emptyValue: T,
    context: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    let decided = false;

    const hasExternal = providers.some((p) => p.kind === 'external');
    const canDecide = (provider: BookCatalogProvider) =>
      hasExternal ? provider.kind === 'external' : true;

    for (const provider of providers) {
      try {
        const value = await call(provider);
        if (canDecide(provider)) decided = true;
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

    if (!decided && lastError !== null) throw lastError;

    return emptyValue;
  }
}
