import { BookInfo } from '@bookjeok/core';
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

/**
 * 자체 DB 공급처 어댑터.
 *
 * 이미 적재된 `books`를 공급처처럼 다룹니다. 외부 공급처가 죽어도 우리가 가진
 * 도서는 계속 찾을 수 있게 하는 최후 방어선입니다.
 *
 * **상세 체인에서는 1순위**입니다(ISBN이 PK라 인덱스 단건 조회).
 * **검색 체인에서는 마지막**입니다 — `title`/`author`에 인덱스가 없어 풀스캔이라,
 * 승격은 인덱스 도입 이후에 판단합니다. 순서의 근거는 `book.module.ts`에 있습니다.
 *
 * `kind`가 `local`인 이유는 이 어댑터의 "못 찾음"이 "그런 책이 없다"가 아니라
 * "우리가 아직 안 가졌다"이기 때문입니다. `BookCatalogService`가 장애와
 * 책 없음을 구분할 때 이 값을 씁니다.
 */
@Injectable()
export class LocalDbBookCatalogProvider implements BookCatalogProvider {
  readonly name = 'local-db';
  readonly kind: BookCatalogProviderKind = 'local';

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async search(
    params: BookCatalogSearchParams,
  ): Promise<BookCatalogSearchResult> {
    const { query, display, start } = params;
    if (!query) {
      return { total: 0, start, display, items: [] };
    }

    const [books, total] = await this.bookRepository
      .createQueryBuilder('book')
      .where('book.title ILIKE :q OR book.author ILIKE :q', { q: `%${query}%` })
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
