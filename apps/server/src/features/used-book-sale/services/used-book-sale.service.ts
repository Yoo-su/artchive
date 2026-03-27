import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource, In, Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { UserService } from '@/features/user/services/user.service';
import { BusinessException } from '@/shared/exceptions';

import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { GetBookSalesQueryDto } from '../dtos/get-book-sales-query.dto';
import { BookSaleSortBy, QueryBookSaleDto } from '../dtos/query-book-sale.dto';
import { UpdateBookSaleDto } from '../dtos/update-book-sale.dto';
import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';
import {
  applyCommonFilters,
  applyCursorFilter,
  applyLocationFilter,
  applySorting,
  encodeCursor,
} from '../utils/sale-query.builder';

@Injectable()
export class UsedBookSaleService {
  // 인기 판매글 캐시 키 및 TTL (10분)
  private static readonly POPULAR_SALES_CACHE_KEY = 'popular_sales';
  private static readonly CACHE_TTL = 600000;

  constructor(
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    private readonly bookService: BookService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 중고책 판매글을 생성합니다.
   * BookResolvePipe를 통해 도서 정보가 DB에 존재함이 보장됩니다.
   * @param createBookSaleDto 판매글 생성 DTO
   * @param userId 작성자 ID
   * @returns 생성된 판매글
   */
  async createUsedBookSale(
    createBookSaleDto: CreateBookSaleDto,
    userId: number,
  ): Promise<UsedBookSale> {
    const { isbn, ...saleData } = createBookSaleDto;

    // 엔티티 생성 및 관계 설정 (ID 참조 방식 활용으로 추가 조회 최소화)
    const newSale = this.usedBookSaleRepository.create({
      ...saleData,
      user: { id: userId } as any, // Shallow reference
      book: { isbn } as any, // Shallow reference
    });

    return await this.usedBookSaleRepository.save(newSale);
  }

  /**
   * 특정 판매글의 상태를 업데이트합니다.
   */
  async updateSaleStatus(
    saleId: number,
    userId: number,
    status: SaleStatus,
  ): Promise<UsedBookSale> {
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

    sale.status = status;
    sale.updatedAt = new Date();
    return await this.usedBookSaleRepository.save(sale);
  }

  /**
   * 판매글 조회수를 증가시킵니다.
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.usedBookSaleRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 인기 판매글을 조회합니다.
   * 최근 3개월 내 조회수 높은 순으로 6개 반환 (결과 캐싱)
   */
  async findPopularSales(): Promise<UsedBookSale[]> {
    // 1. 캐시 확인
    const cached = await this.cacheManager.get<UsedBookSale[]>(
      UsedBookSaleService.POPULAR_SALES_CACHE_KEY,
    );
    if (cached) return cached;

    // 2. 인기 판매글 ID 조회
    const idResults = await this.getPopularSaleIds(6);
    if (idResults.length === 0) return [];

    const ids = idResults.map((r) => r.id);

    // 3. 엔티티 상세 조회 및 순서 유지
    const result = await this.findSalesByIdsInOrder(ids);

    // 4. 결과 캐싱 (10분)
    await this.cacheManager.set(
      UsedBookSaleService.POPULAR_SALES_CACHE_KEY,
      result,
      UsedBookSaleService.CACHE_TTL,
    );

    return result;
  }

  /**
   * 최근 3개월간 조회수가 가장 높은 판매 중인 글 ID를 조회합니다.
   */
  private async getPopularSaleIds(limit: number): Promise<{ id: number }[]> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return await this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .select('sale.id', 'id')
      .where('sale.status = :status', { status: SaleStatus.FOR_SALE })
      .andWhere('sale.createdAt >= :threeMonthsAgo', { threeMonthsAgo })
      .orderBy('sale.viewCount', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * ID 목록에 해당하는 판매글을 주어진 ID 순서대로 조회합니다.
   */
  private async findSalesByIdsInOrder(ids: number[]): Promise<UsedBookSale[]> {
    const sales = await this.usedBookSaleRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'book'],
    });

    const saleMap = new Map(sales.map((s) => [s.id, s]));
    return ids
      .map((id) => saleMap.get(id))
      .filter((s): s is UsedBookSale => !!s);
  }

  /**
   * ID로 판매글을 조회합니다.
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

    // limit + 1개를 조회하여 다음 페이지 존재 여부 판별 (COUNT 쿼리 제거)
    queryBuilder.take(limit + 1);

    const { entities: sales, raw } = await queryBuilder.getRawAndEntities();

    // 페이지네이션 정보 계산
    const hasNextPage = sales.length > limit;
    if (hasNextPage) {
      sales.pop(); // 초과 조회분 제거
      raw.pop();
    }

    let nextCursor: string | null = null;

    if (hasNextPage && sales.length > 0) {
      const lastItem = sales[sales.length - 1];
      const lastRaw = raw[raw.length - 1];

      let cursorValue: string | number = lastItem.id;
      if (sortBy === BookSaleSortBy.PRICE) {
        cursorValue = lastItem.price;
      } else if (sortBy === BookSaleSortBy.DISTANCE) {
        cursorValue = Number(lastRaw.distance);
      }

      nextCursor = encodeCursor({ value: cursorValue, id: lastItem.id });
    }

    return {
      sales,
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
   * ISBN별 판매글 목록을 조회합니다.
   */
  async findSalesByIsbn(isbn: string, queryDto: GetBookSalesQueryDto) {
    const { page, limit, city, district } = queryDto;

    const queryBuilder = this.usedBookSaleRepository
      .createQueryBuilder('sale')
      .where('sale.isbn = :isbn', { isbn })
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
      ])
      .orderBy('sale.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit + 1); // limit + 1개를 조회하여 다음 페이지 존재 여부 판별

    if (city) {
      queryBuilder.andWhere('sale.city = :city', { city });
    }
    if (district) {
      queryBuilder.andWhere('sale.district = :district', { district });
    }

    const sales = await queryBuilder.getMany();

    const hasNextPage = sales.length > limit;
    if (hasNextPage) {
      sales.pop(); // 초과 조회분 제거
    }

    return {
      sales,
      page,
      hasNextPage,
    };
  }

  /**
   * 판매글을 업데이트합니다.
   */
  async updateUsedBookSale(
    saleId: number,
    userId: number,
    updateBookSaleDto: UpdateBookSaleDto,
  ): Promise<UsedBookSale> {
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

    const updatedSale = this.usedBookSaleRepository.merge(
      sale,
      updateBookSaleDto,
    );

    updatedSale.updatedAt = new Date();

    return await this.usedBookSaleRepository.save(updatedSale);
  }

  /**
   * 판매글을 삭제합니다.
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
      where: { status: SaleStatus.FOR_SALE },
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user', 'book'],
    });
  }
}
