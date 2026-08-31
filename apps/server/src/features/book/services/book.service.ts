import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ReadingLogService } from '@/features/reading-log/services/reading-log.service';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { Book } from '../entities/book.entity';
import { AladinBookSearchService } from './aladin-book-search.service';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly readingLogService: ReadingLogService,
    private readonly wishlistService: WishlistService,
    private readonly aladinBookSearchService: AladinBookSearchService,
  ) {}

  // 동일 ISBN에 대해 동시에 진행 중인 resolveBook 작업을 관리하는 Map (Request Collapsing)
  private resolveTasks = new Map<string, Promise<Book>>();

  /**
   * 책 정보를 조회하거나 생성합니다.
   * - Read-heavy 워크로드 최적화를 위해 조회를 우선 시도합니다.
   * - 동시성 이슈(Race Condition) 해결을 위해 `INSERT ... ON CONFLICT DO NOTHING` 패턴을 사용합니다.
   * - DB에 없을 경우 알라딘 API를 통해 백엔드에서 자체적으로 정보를 확보합니다.
   */
  async resolveBook(isbn: string): Promise<Book> {
    // 1. 빠른 조회 (Happy Path) - 이미 존재하면 즉시 반환
    const existingBook = await this.bookRepository.findOneBy({ isbn });
    if (existingBook) {
      return existingBook;
    }

    // 2. 진행 중인 동일 작업이 있는지 확인 (Request Collapsing)
    const existingTask = this.resolveTasks.get(isbn);
    if (existingTask) {
      return existingTask;
    }

    // 3. 동시 요청 관리를 위해 Promise를 Map에 저장
    const resolveTask = (async () => {
      try {
        // 외부 API(알라딘)에서 책 정보 상세 조회 (ItemLookUp -> ItemSearch fallback)
        let bookData = await this.aladinBookSearchService.searchDetail(isbn);
        if (!bookData) {
          const books = await this.aladinBookSearchService.search(isbn, 1);
          if (books && books.length > 0) {
            bookData = books[0];
          }
        }

        if (!bookData) {
          throw new BusinessException('BOOK_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        // 안전한 데이터 생성 (Concurrency Safe)
        const newBook = this.bookRepository.create({
          isbn: bookData.isbn || isbn,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher,
          description: bookData.description || '',
          image: bookData.image || '',
          discount: String(bookData.discount || ''),
          viewCount: 0,
        });

        await this.bookRepository
          .createQueryBuilder()
          .insert()
          .into(Book)
          .values(newBook)
          .orIgnore() // 중복 발생 시 DB 레벨에서 무시
          .execute();

        // 불필요한 추가 조회 없이 생성된 객체를 반환 (최적화)
        // Note: createdAt/updatedAt은 DB 기본값으로 채워지지만,
        // Sync 시점의 호출자에겐 데이터의 존재 여부가 더 중요하므로 성능을 위해 추가 조회를 지양합니다.
        return newBook;
      } finally {
        // 작업 완료 후 Map에서 제거
        this.resolveTasks.delete(isbn);
      }
    })();

    this.resolveTasks.set(isbn, resolveTask);
    return resolveTask;
  }

  /**
   * 책 상세페이지 조회수를 증가시킵니다.
   */
  async incrementBookViewCount(isbn: string): Promise<void> {
    await this.bookRepository.increment({ isbn }, 'viewCount', 1);
  }

  /**
   * 인기 도서 목록을 조회합니다.
   * - 인기도 = (책 조회수 * 1) + (독서기록 수 * 10) + (위시리스트 수 * 8) + (리뷰 수 * 5)
   */
  async findPopularBooks(): Promise<Book[]> {
    // 각 연관 테이블의 누적 개수를 구하는 서브쿼리 정의
    const readingLogCountSubQuery = `SELECT COUNT(*) FROM reading_logs log WHERE log."isbn" = book.isbn`;
    const reviewCountSubQuery = `SELECT COUNT(*) FROM reviews review WHERE review."isbn" = book.isbn`;
    const wishlistCountSubQuery = `SELECT COUNT(*) FROM wishlists wish WHERE wish."isbn" = book.isbn`;

    const rawResults = await this.bookRepository
      .createQueryBuilder('book')
      // 조회수가 1 이상이거나, 독서기록/리뷰/찜 중 하나라도 활동이 있는 도서로 대상을 압축 (성능 최적화 및 초기 데이터 안전성 확보)
      .where(
        `book.viewCount > 0 
         OR EXISTS (SELECT 1 FROM reading_logs log WHERE log."isbn" = book.isbn) 
         OR EXISTS (SELECT 1 FROM wishlists wish WHERE wish."isbn" = book.isbn) 
         OR EXISTS (SELECT 1 FROM reviews review WHERE review."isbn" = book.isbn)`,
      )
      .addSelect(`(${readingLogCountSubQuery})`, 'readingLogCount')
      .addSelect(`(${reviewCountSubQuery})`, 'reviewCount')
      .addSelect(`(${wishlistCountSubQuery})`, 'wishlistCount')
      .select([
        'book.isbn AS isbn',
        'book.title AS title',
        'book.author AS author',
        'book.publisher AS publisher',
        'book.discount AS discount',
        'book.description AS description',
        'book.image AS image',
        'COALESCE(book.viewCount, 0) AS "viewCount"',
        'book.createdAt AS "createdAt"',
        'book.updatedAt AS "updatedAt"',
      ])
      .orderBy(
        `COALESCE(book.viewCount, 0) * 1 
         + (${readingLogCountSubQuery}) * 10 
         + (${wishlistCountSubQuery}) * 8 
         + (${reviewCountSubQuery}) * 5`,
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
      discount: raw.discount,
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

  /**
   * 특정 책의 통계 정보를 조회합니다 (읽은 유저 수, 위시리스트 유저 수).
   * @param isbn - 책 ISBN
   */
  async getBookStats(
    isbn: string,
  ): Promise<{ readingUserCount: number; wishlistUserCount: number }> {
    const readingUserCount =
      await this.readingLogService.countUniqueReaders(isbn);
    const wishlistUserCount =
      await this.wishlistService.countUniqueWishlistUsers(isbn);

    return {
      readingUserCount,
      wishlistUserCount,
    };
  }

  /**
   * ISBN으로 도서를 단건 조회합니다. (외부 생성 흐름 없이 단순 조회 전용)
   */
  async findBookByIsbn(isbn: string): Promise<Book | null> {
    return await this.bookRepository.findOneBy({ isbn });
  }

  /**
   * ISBN 목록으로 도서들을 일괄 조회합니다. (N+1 쿼리 최적화)
   */
  async findBooksByIsbns(isbns: string[]): Promise<Book[]> {
    if (isbns.length === 0) return [];
    return await this.bookRepository.findBy({ isbn: In(isbns) });
  }
}
