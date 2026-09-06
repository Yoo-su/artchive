import { BookInfo } from '@bookjeok/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Book } from '../entities/book.entity';
import {
  BookCatalogProvider,
  BookCatalogSearchParams,
  BookCatalogSearchResult,
} from './book-catalog.types';

/**
 * 자체 DB 공급처 어댑터.
 *
 * 이미 적재된 `books`를 공급처처럼 다룹니다. 외부 공급처가 죽어도 우리가 가진
 * 도서는 계속 찾을 수 있게 하는 최후 방어선입니다.
 *
 * 현재 체인의 마지막에 놓여 있어 앞선 공급처가 실패하거나 결과가 없을 때만
 * 동작합니다. 자체 DB를 1차 검색으로 올릴지는 Phase 3에서 판단합니다.
 * (`title`/`author`에 인덱스가 없어 지금은 풀스캔이므로 승격 전에 인덱스가 필요합니다.)
 */
@Injectable()
export class LocalDbBookCatalogProvider implements BookCatalogProvider {
  readonly name = 'local-db';

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
