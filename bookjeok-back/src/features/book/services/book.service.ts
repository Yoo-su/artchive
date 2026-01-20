import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Book } from '../entities/book.entity';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { BookInfoDto } from '../dtos/book-info.dto';
import { UserService } from '../../user/services/user.service';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { BookSaleSortBy, QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import {
  applyCommonFilters,
  applyCursorFilter,
  applyLocationFilter,
  applySorting,
  encodeCursor,
} from '../utils/book-query.builder';
import { BusinessException } from '@/shared/exceptions';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 책 정보가 DB에 있으면 찾고, 없으면 새로 생성합니다.
   * @param bookInfoDto 책 정보 DTO
   * @returns 책 엔티티
   */
  private async findOrCreateBook(bookInfoDto: BookInfoDto): Promise<Book> {
    let book = await this.bookRepository.findOneBy({ isbn: bookInfoDto.isbn });
    if (!book) {
      book = this.bookRepository.create(bookInfoDto);
      await this.bookRepository.save(book);
    }
    return book;
  }

  /**
   * 중고책 판매글을 생성합니다.
   * @param createBookSaleDto 판매글 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 판매글
   */
  async createUsedBookSale(
    createBookSaleDto: CreateBookSaleDto,
    userId: number,
  ): Promise<UsedBookSale> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. 책 정보 찾기 또는 생성 (트랜잭션 내에서 처리)
      let book = await manager.findOne(Book, {
        where: { isbn: createBookSaleDto.book.isbn },
      });

      if (!book) {
        book = manager.create(Book, createBookSaleDto.book);
        book = await manager.save(Book, book);
      }

      // 2. 판매글 생성
      const newSale = manager.create(UsedBookSale, {
        ...createBookSaleDto,
        user,
        book,
      });

      return manager.save(UsedBookSale, newSale);
    });
  }

  /**
   * 특정 판매글의 상태를 업데이트합니다.
   * @param saleId - 업데이트할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   * @param status - 변경할 새로운 상태
   * @returns 업데이트된 판매글 정보
   */
  async updateSaleStatus(
    saleId: number,
    userId: number,
    status: SaleStatus,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'], // 소유권 확인을 위해 user 정보를 함께 조회
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 판매글의 작성자와 현재 로그인한 사용자가 동일한지 확인
    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    sale.status = status;
    sale.updatedAt = new Date();
    return await this.usedBookSaleRepository.save(sale);
  }

  /**
   * 판매글 조회수를 증가시킵니다.
   * @param id 판매글 ID
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.usedBookSaleRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 책 상세페이지 조회수를 증가시킵니다.
   * @param isbn 책 ISBN
   */
  async incrementBookViewCount(isbn: string): Promise<void> {
    // 책이 존재하는 경우에만 조회수 증가
    const result = await this.bookRepository.increment(
      { isbn },
      'viewCount',
      1,
    );
    // affected가 0이면 책이 존재하지 않음 (아무 작업도 하지 않음)
    if (result.affected === 0) {
      // 책이 DB에 없으면 조용히 무시 (네이버 API로만 조회된 책)
      return;
    }
  }

  /**
   * 인기책 목록을 조회합니다.
   * 인기도 점수 = 책 조회수*1 + 판매글 조회수 합계*2 + 리뷰 조회수 합계*2 + 리액션 합계*3
   * @returns 인기책 목록 (최대 10개)
   */
  async findPopularBooks(): Promise<Book[]> {
    // getRawMany()를 사용하여 집계 결과와 함께 조회
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

    // Raw 결과를 Book 형태로 변환
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
   * 인기 판매글을 조회합니다.
   * 최근 2주 내 조회수 높은 순으로 6개 반환
   */
  async findPopularSales(): Promise<UsedBookSale[]> {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    interface PopularSaleRawResult {
      id: number;
    }

    // 최근 인기 판매글 (최근 2주, 조회수 순, 6개)
    const idResults = await this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .select('sale.id', 'id')
      .where('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .andWhere('sale.createdAt >= :twoWeeksAgo', { twoWeeksAgo })
      .orderBy('sale.viewCount', 'DESC')
      .limit(6)
      .getRawMany<PopularSaleRawResult>();

    if (idResults.length === 0) {
      return [];
    }

    const ids = idResults.map((r) => r.id);

    // 엔티티 상세 조회
    const sales = await this.usedBookSaleRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'book'],
    });

    // 순서 유지
    const saleMap = new Map(sales.map((s) => [s.id, s]));
    return ids
      .map((id) => saleMap.get(id))
      .filter((s): s is UsedBookSale => !!s);
  }

  /**
   * ID로 판매글을 조회합니다.
   * @param id 판매글 ID
   * @returns 판매글 정보
   */
  async findSaleById(id: number) {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return sale;
  }

  /**
   * 수정을 위한 판매글 조회 (소유권 검증 포함)
   * 본인의 판매글만 조회 가능하며, 타인의 글 접근 시 403 FORBIDDEN을 반환합니다.
   * @param id 판매글 ID
   * @param userId 요청자 ID
   * @returns 판매글 정보 (본인 글만)
   */
  async findSaleForEdit(id: number, userId: number) {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return sale;
  }

  /**
   * 조건에 따라 판매글 목록을 검색합니다.
   * @param queryDto 검색 조건 DTO
   * @returns 판매글 목록 및 메타데이터
   */
  async searchSales(queryDto: QueryBookSaleDto) {
    const {
      page = 1,
      limit = 12,
      sortBy = BookSaleSortBy.CREATED_AT,
    } = queryDto;

    const queryBuilder = this.createBaseSearchQuery();

    applyCommonFilters(queryBuilder, queryDto);
    applyLocationFilter(queryBuilder, queryDto);
    applySorting(
      queryBuilder,
      sortBy,
      queryDto.sortOrder || 'DESC',
      queryDto.lat,
      queryDto.lng,
    );
    applyCursorFilter(queryBuilder, queryDto);

    queryBuilder.take(limit);

    // getRawAndEntities를 사용하여 계산된 컬럼(distance 등)도 가져옴
    const { entities: sales, raw } = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    // 다음 커서 계산
    let nextCursor: string | null = null;

    if (sales.length > 0) {
      const lastItem = sales[sales.length - 1];
      const lastRaw = raw[raw.length - 1]; // items 순서가 entities와 일치함

      let cursorValue: string | number = lastItem.id;

      if (sortBy === BookSaleSortBy.PRICE) {
        cursorValue = lastItem.price;
      } else if (sortBy === BookSaleSortBy.DISTANCE) {
        // raw 결과에서 distance 컬럼 찾기 (별칭이 'distance'로 지정됨)
        cursorValue = Number(lastRaw.distance);
      }
      // CREATED_AT의 경우 ID를 커서로 사용 (auto-increment ID는 생성 시간 순서와 일치)

      nextCursor = encodeCursor({ value: cursorValue, id: lastItem.id });
    }

    // 커서 방식일 때 hasNextPage 계산
    const hasNextPage = sales.length === limit;

    return {
      sales,
      total,
      page,
      limit,
      hasNextPage,
      nextCursor,
    };
  }

  private createBaseSearchQuery() {
    return this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select([
        'sale.id',
        'sale.title',
        'sale.price',
        'sale.status',
        'sale.createdAt',
        'sale.updatedAt',
        'sale.imageUrls',
        'sale.city',
        'sale.district',
        'sale.viewCount',
        'user.id',
        'user.handle',
        'user.nickname',
        'user.profileImageUrl',
        'book',
      ]);
  }

  /**
   * ISBN과 쿼리 옵션으로 판매글 목록을 조회하는 메서드
   */
  async findSalesByIsbn(isbn: string, queryDto: GetBookSalesQueryDto) {
    const { page, limit, city, district } = queryDto;

    const queryBuilder = this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .where('sale.bookIsbn = :isbn', { isbn })
      .leftJoinAndSelect('sale.user', 'user')
      .leftJoinAndSelect('sale.book', 'book')
      .select([
        'sale.id',
        'sale.title',
        'sale.price',
        'sale.status',
        'sale.createdAt',
        'sale.updatedAt',
        'sale.imageUrls',
        'sale.city',
        'sale.district',
        'sale.viewCount',
        'user.id',
        'user.handle',
        'user.nickname',
        'user.profileImageUrl',
        'book', // book 객체 전체 선택
      ])
      .orderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // 지역 필터링 조건이 있을 경우 동적으로 추가
    if (city) {
      queryBuilder.andWhere('sale.city = :city', { city });
    }
    if (district) {
      queryBuilder.andWhere('sale.district = :district', { district });
    }

    const [sales, total] = await queryBuilder.getManyAndCount();

    const hasNextPage = page * limit < total;

    return {
      sales,
      total,
      page,
      hasNextPage,
    };
  }

  /**
   * 특정 판매글의 정보를 업데이트합니다.
   * @param saleId - 업데이트할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   * @param updateBookSaleDto - 업데이트할 판매글 정보
   * @returns 업데이트된 판매글 정보
   */
  async updateUsedBookSale(
    saleId: number,
    userId: number,
    updateBookSaleDto: UpdateBookSaleDto,
  ): Promise<UsedBookSale> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'], // 소유권 확인을 위해 user 정보를 함께 조회
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // DTO의 내용과 기존 판매글 데이터를 병합합니다.
    // DTO에 포함된 필드만 업데이트됩니다.
    const updatedSale = this.usedBookSaleRepository.merge(
      sale,
      updateBookSaleDto,
    );

    updatedSale.updatedAt = new Date();

    return await this.usedBookSaleRepository.save(updatedSale);
  }

  /**
   * 특정 판매글을 삭제합니다.
   * @param saleId - 삭제할 판매글 ID
   * @param userId - 요청을 보낸 사용자 ID (소유권 확인용)
   */
  async deleteUsedBookSale(saleId: number, userId: number): Promise<void> {
    const sale = await this.usedBookSaleRepository.findOne({
      where: { id: saleId },
      relations: ['user'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== userId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    await this.usedBookSaleRepository.remove(sale);
  }

  /**
   * 가장 최근에 등록된 중고책 판매글을 조회합니다. (최대 10개)
   */
  async findRecentSales(): Promise<UsedBookSale[]> {
    return await this.usedBookSaleRepository.find({
      where: { status: SaleStatus.FOR_SALE }, // 판매중인 판매글만 조회
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user', 'book'], // 작성자, 책 정보 포함
    });
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
      .take(20) // 최대 20개까지만 조회
      .getMany();
  }
}
