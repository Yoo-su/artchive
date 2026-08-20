import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { BookService } from '../services/book.service';

/**
 * 전송받은 데이터에 도서 식별자(ISBN)가 포함되어 있을 경우,
 * 해당 도서가 DB에 존재하는지 확인하고 없으면 외부 API를 통해 생성(Sync)하는 파이프입니다.
 * 이를 통해 서비스 레이어에서는 항상 유효한 도서 데이터가 DB에 있음을 보장받을 수 있습니다.
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
