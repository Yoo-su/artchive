import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { BookService } from '../services/book.service';

/**
 * 요청에 도서 식별자(ISBN)가 있으면 그 도서가 `books`에 존재하는지 확인하는 파이프입니다.
 * 서비스 레이어는 항상 유효한 도서가 DB에 있음을 보장받습니다.
 *
 * 없으면 `resolveBook()`이 BOOK_NOT_FOUND(404)를 던집니다. 이 가드가 없으면 각
 * 서비스가 `books`를 참조하는 행을 만들다 외래키 위반으로 500을 내고,
 * `reading_logs`처럼 FK가 없는 테이블에서는 고아 행이 생깁니다.
 *
 * 2026-09-08 이전에는 없는 도서를 외부 API로 받아와 생성했습니다. 공급처 체인에서
 * 알라딘을 제거하면서 그 동작은 사라졌고, 지금은 순수한 입력 검증입니다.
 */
@Injectable()
export class BookResolvePipe implements PipeTransform {
  constructor(private readonly bookService: BookService) {}

  async transform<T>(value: T, metadata: ArgumentMetadata): Promise<T> {
    // 1. Body 데이터 처리 (isbn 필드 또는 위시리스트 id)
    if (metadata.type === 'body' && value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const rawIsbn =
        record.isbn ?? (record.type === 'BOOK' ? record.id : null);

      if (typeof rawIsbn === 'string' || typeof rawIsbn === 'number') {
        await this.bookService.resolveBook(String(rawIsbn));
      }
    }

    // 2. Param 데이터 처리 (isbn 파라미터)
    if (metadata.type === 'param' && typeof value === 'string') {
      await this.bookService.resolveBook(value);
    }

    return value;
  }
}
