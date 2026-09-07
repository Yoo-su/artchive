import { Injectable } from '@nestjs/common';

import { AladinBookSearchService } from '../services/aladin-book-search.service';
import {
  BookCatalogProvider,
  BookCatalogProviderKind,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from './book-catalog.types';

/**
 * 알라딘 공급처 어댑터.
 *
 * 2026-10-30에 알라딘 Open API가 종료되므로 그때 이 파일과
 * `AladinBookSearchService`를 함께 지웁니다. 그전까지는 유효한 공급처입니다.
 */
@Injectable()
export class AladinBookCatalogProvider implements BookCatalogProvider {
  readonly name = 'aladin';
  readonly kind: BookCatalogProviderKind = 'external';

  constructor(private readonly aladin: AladinBookSearchService) {}

  async search(
    params: BookCatalogSearchParams,
  ): Promise<BookCatalogSearchResult> {
    const result = await this.aladin.searchFormatted(
      params.query,
      params.display,
      params.start,
      params.sort,
      params.field,
    );

    return {
      total: result.total,
      start: result.start,
      display: result.display,
      items: result.items,
    };
  }

  async findByIsbn(isbn: string) {
    const result = await this.aladin.searchDetailFormatted(isbn);
    return result.items[0] ?? null;
  }
}
