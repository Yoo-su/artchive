import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ReadingLogService } from '@/features/reading-log/services/reading-log.service';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';

import { Book } from '../entities/book.entity';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let module: TestingModule;

  const mockReadingLogService = {
    countUniqueReaders: jest.fn(),
  };

  const mockWishlistService = {
    countUniqueWishlistUsers: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(Book),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
              where: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
            update: jest.fn(),
          },
        },
        {
          provide: ReadingLogService,
          useValue: mockReadingLogService,
        },
        {
          provide: WishlistService,
          useValue: mockWishlistService,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  describe('resolveBook', () => {
    it('자체 DB에 있으면 그 도서를 반환한다', async () => {
      const isbn = '9788932925554';
      const existing = { isbn, title: '바움가트너' } as Book;
      const repo = module.get(getRepositoryToken(Book));
      repo.findOneBy.mockResolvedValue(existing);

      const result = await service.resolveBook(isbn);

      expect(result).toEqual(existing);
      expect(repo.findOneBy).toHaveBeenCalledWith({ isbn });
    });

    it('자체 DB에 없으면 BOOK_NOT_FOUND를 던진다', async () => {
      const repo = module.get(getRepositoryToken(Book));
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.resolveBook('9999999999999')).rejects.toMatchObject({
        errorCode: 'BOOK_NOT_FOUND',
      });
    });

    it('조회는 정확히 한 번만 한다', async () => {
      // 예전에는 서비스가 한 번, 공급처 체인이 또 한 번 같은 findOneBy를 돌렸다.
      const repo = module.get(getRepositoryToken(Book));
      repo.findOneBy.mockResolvedValue({ isbn: '1' } as Book);

      await service.resolveBook('1');

      expect(repo.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('없는 도서를 저장하지 않는다', async () => {
      // 외부 공급처가 사라졌으므로 이 경로에서 INSERT가 일어나면 안 된다.
      const repo = module.get(getRepositoryToken(Book));
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.resolveBook('9999999999999')).rejects.toThrow();

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findPopularBooks', () => {
    it('활동 테이블을 미리 집계해 조인한다', async () => {
      const repo = module.get(getRepositoryToken(Book));
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            isbn: '1',
            title: 'Pop',
            viewCount: 10,
            pubDate: '2024-01-01',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findPopularBooks();

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('book');
      // 상관 서브쿼리 대신 집계 조인 3개를 쓴다. 이게 4.9초 병목을 없앤 지점이라
      // 다시 서브쿼리로 돌아가면 이 테스트가 깨진다.
      expect(qb.leftJoin).toHaveBeenCalledTimes(3);
      expect(qb.limit).toHaveBeenCalledWith(10);
      expect(result[0].viewCount).toBe(10);
      expect(result[0].pubDate).toBe('2024-01-01');
    });

    it('viewCount가 없어도 0으로 채운다', async () => {
      const repo = module.get(getRepositoryToken(Book));
      const qb = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ isbn: '1', title: 'X', viewCount: null }]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await service.findPopularBooks();

      expect(result[0].viewCount).toBe(0);
      expect(result[0].pubDate).toBeNull();
    });
  });

  describe('getBookStats', () => {
    it('should return readingUserCount and wishlistUserCount', async () => {
      const isbn = '123';
      mockReadingLogService.countUniqueReaders.mockResolvedValue(3);
      mockWishlistService.countUniqueWishlistUsers.mockResolvedValue(5);

      const result = await service.getBookStats(isbn);

      expect(result).toEqual({
        readingUserCount: 3,
        wishlistUserCount: 5,
      });
      expect(mockReadingLogService.countUniqueReaders).toHaveBeenCalledWith(
        isbn,
      );
      expect(mockWishlistService.countUniqueWishlistUsers).toHaveBeenCalledWith(
        isbn,
      );
    });
  });
});
