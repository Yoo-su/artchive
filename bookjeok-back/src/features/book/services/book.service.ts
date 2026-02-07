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
   * 책 정보를 조회하거나 생성합니다.
   * - Read-heavy 워크로드 최적화를 위해 조회를 우선 시도합니다.
   * - 동시성 이슈(Race Condition) 해결을 위해 `INSERT ... ON CONFLICT DO NOTHING` 패턴을 사용합니다.
   */
  async findOrCreateBook(bookInfoDto: BookInfoDto): Promise<Book> {
    // 1. 빠른 조회 (Happy Path)
    const existingBook = await this.bookRepository.findOneBy({
      isbn: bookInfoDto.isbn,
    });
    if (existingBook) {
      return existingBook;
    }

    // 2. 안전한 생성 (Concurrency Safe)
    await this.bookRepository
      .createQueryBuilder()
      .insert()
      .into(Book)
      .values(bookInfoDto)
      .orIgnore() // 중복 발생 시 DB 레벨에서 무시
      .execute();

    // 3. 최종 조회
    const book = await this.bookRepository.findOneBy({
      isbn: bookInfoDto.isbn,
    });

    if (!book) {
      throw new Error('Unexpected error: Book not found after creation');
    }

    return book;
  }

  /**
   * 책 상세페이지 조회수를 증가시킵니다.
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
   * 인기 도서 목록을 조회합니다.
   * - 인기도 = (책 조회수 * 1) + (판매글 조회수 * 2) + (리뷰 조회수 * 2) + (리액션 * 3)
   * - Cartesian Product 방지를 위해 Subquery를 사용하여 집계합니다.
   */
  async findPopularBooks(): Promise<Book[]> {
    const rawResults = await this.bookRepository
      .createQueryBuilder('book')
      // 판매글 조회수 집계 (Subquery)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(SUM(sale.viewCount), 0)')
            .from('used_book_sales', 'sale')
            .where('sale.bookIsbn = book.isbn'),
        'totalSaleViews',
      )
      // 리뷰 조회수 집계 (Subquery)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(SUM(review.viewCount), 0)')
            .from('reviews', 'review')
            .where('review.bookIsbn = book.isbn'),
        'totalReviewViews',
      )
      // 리액션 집계 (Subquery)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(SUM(review.reactionCount), 0)')
            .from('reviews', 'review')
            .where('review.bookIsbn = book.isbn'),
        'totalReviewReactions',
      )
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
      // 점수 계산 (Subquery Alias 사용 불가 -> 수식 반복하거나, DB 뷰 사용해야 함.
      // 여기서는 가독성을 위해 Subquery를 다시 명시하지 않고,
      // 쿼리 최적화를 위해 위에서 계산된 가상 컬럼을 활용할 수 없으므로,
      // TypeORM에서는 addSelect 된 값을 orderBy에 직접 사용할 수 있음)
      .orderBy(
        `COALESCE(book.viewCount, 0) * 1 
         + ("totalSaleViews") * 2 
         + ("totalReviewViews") * 2 
         + ("totalReviewReactions") * 3`,
        'DESC',
      )
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
      // Raw query라 relation은 비어있음
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
