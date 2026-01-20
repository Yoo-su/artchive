import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BookInfoDto } from '../dtos/book-info.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  /**
   * 책 정보가 DB에 있으면 찾고, 없으면 새로 생성합니다.
   * @param bookInfoDto 책 정보 DTO
   * @returns 책 엔티티
   */
  async findOrCreateBook(bookInfoDto: BookInfoDto): Promise<Book> {
    let book = await this.bookRepository.findOneBy({ isbn: bookInfoDto.isbn });
    if (!book) {
      book = this.bookRepository.create(bookInfoDto);
      await this.bookRepository.save(book);
    }
    return book;
  }

  /**
   * 책 상세페이지 조회수를 증가시킵니다.
   * @param isbn 책 ISBN
   */
  async incrementBookViewCount(isbn: string): Promise<void> {
    const result = await this.bookRepository.increment(
      { isbn },
      'viewCount',
      1,
    );
    // 책이 DB에 없으면 조용히 무시 (네이버 API로만 조회된 책)
    if (result.affected === 0) {
      return;
    }
  }

  /**
   * 인기책 목록을 조회합니다.
   * 인기도 점수 = 책 조회수*1 + 판매글 조회수 합계*2 + 리뷰 조회수 합계*2 + 리액션 합계*3
   * @returns 인기책 목록 (최대 10개)
   */
  async findPopularBooks(): Promise<Book[]> {
    const rawResults = await this.bookRepository
      .createQueryBuilder('book')
      .leftJoin('book.usedBookSales', 'sale')
      .leftJoin('reviews', 'review', 'review.bookIsbn = book.isbn')
      .select([
        'book.isbn AS isbn',
        'book.title AS title',
        'book.author AS author',
        'book.publisher AS publisher',
        'book.description AS description',
        'book.image AS image',
        'COALESCE(book.viewCount, 0) AS "viewCount"',
        'book.createdAt AS "createdAt"',
        'book.updatedAt AS "updatedAt"',
      ])
      .addSelect(
        `COALESCE(book.viewCount, 0) * 1 
         + COALESCE(SUM(sale.viewCount), 0) * 2 
         + COALESCE(SUM(review.viewCount), 0) * 2 
         + COALESCE(SUM(review.reactionCount), 0) * 3`,
        'popularityScore',
      )
      .groupBy('book.isbn')
      .orderBy('"popularityScore"', 'DESC')
      .addOrderBy('"viewCount"', 'DESC')
      .limit(10)
      .getRawMany();

    return rawResults.map((raw) => ({
      isbn: raw.isbn,
      title: raw.title,
      author: raw.author,
      publisher: raw.publisher,
      description: raw.description,
      image: raw.image,
      viewCount: Number(raw.viewCount) || 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      usedBookSales: [],
    })) as Book[];
  }

  /**
   * 책 제목 또는 저자로 책을 검색합니다.
   * @param query - 검색어
   */
  async searchBooks(query: string): Promise<Book[]> {
    if (!query) {
      return [];
    }

    return await this.bookRepository
      .createQueryBuilder('book')
      .where('book.title LIKE :query OR book.author LIKE :query', {
        query: `%${query}%`,
      })
      .take(20)
      .getMany();
  }
}
