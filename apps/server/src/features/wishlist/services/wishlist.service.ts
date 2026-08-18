import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Repository } from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';
import { Wishlist } from '@/features/user/entities/wishlist.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  /**
   * 위시리스트에 항목을 추가합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID (ISBN 또는 Sale ID)
   * @returns 위시리스트 항목
   */
  @Transactional()
  async addToWishlist(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
  ) {
    const manager = this.txHost.tx;

    // 이미 찜했는지 확인
    const existing = await manager.findOne(Wishlist, {
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
      relations: ['book', 'usedBookSale'],
    });

    if (existing) {
      return existing;
    }

    let book: Book | null = null;
    let sale: UsedBookSale | null = null;

    if (type === 'BOOK') {
      book = await manager.findOne(Book, {
        where: { isbn: id as string },
      });

      if (!book) {
        throw new BusinessException('BOOK_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
    } else {
      sale = await manager.findOne(UsedBookSale, {
        where: { id: id as number },
      });
      if (!sale) {
        throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      if (sale.status !== SaleStatus.FOR_SALE) {
        throw new BusinessException(
          'WISHLIST_INVALID_STATUS',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // orIgnore()를 통해 동시 요청 시 23505 유니크 충돌 방어 및 멱등성 보장
    await manager
      .createQueryBuilder()
      .insert()
      .into(Wishlist)
      .values({
        user: { id: userId } as User,
        book: book ? ({ isbn: book.isbn } as Book) : null,
        usedBookSale: sale ? ({ id: sale.id } as UsedBookSale) : null,
        isbn: book ? book.isbn : null,
      })
      .orIgnore()
      .execute();

    // 저장된 항목 조회하여 반환
    return await manager.findOne(Wishlist, {
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
      relations: ['book', 'usedBookSale'],
    });
  }

  /**
   * 위시리스트에서 항목을 제거합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID
   * @returns 제거된 항목
   */
  async removeFromWishlist(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
  ) {
    const wishlist = await this.wishlistRepository.findOne({
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
    });

    if (!wishlist) {
      throw new BusinessException('WISHLIST_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return await this.wishlistRepository.remove(wishlist);
  }

  /**
   * 유저의 위시리스트 목록을 조회합니다.
   * @param userId 유저 ID
   * @returns 위시리스트 목록
   */
  async getWishlist(userId: number) {
    return await this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'usedBookSale', 'usedBookSale.book'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 특정 항목이 위시리스트에 있는지 확인합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID
   * @returns 포함 여부
   */
  async checkWishlistStatus(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
  ) {
    const exists = await this.wishlistRepository.exists({
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
    });
    return { isWishlisted: exists };
  }

  /**
   * 특정 책을 위시리스트에 담은 고유 유저 수를 구합니다.
   */
  async countUniqueWishlistUsers(isbn: string): Promise<number> {
    const result = await this.wishlistRepository
      .createQueryBuilder('wishlist')
      .select('COUNT(DISTINCT wishlist.userId)', 'count')
      .where('wishlist.isbn = :isbn', { isbn })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }
}
