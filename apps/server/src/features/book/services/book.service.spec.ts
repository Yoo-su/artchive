import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ReadingLogService } from '@/features/reading-log/services/reading-log.service';
import { WishlistService } from '@/features/wishlist/services/wishlist.service';

import { Book } from '../entities/book.entity';
import { BookService } from './book.service';
import { NaverBookSearchService } from './naver-book-search.service';

describe('BookService', () => {
  let service: BookService;
  let module: TestingModule;

  const mockNaverBookSearchService = {
    search: jest.fn(),
  };

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
        {
          provide: NaverBookSearchService,
          useValue: mockNaverBookSearchService,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  describe('resolveBook', () => {
    it('should return existing book if found initially', async () => {
      const isbn = '123';
      const existingBook = { isbn: '123', title: 'Existing' };

      const repo = module.get(getRepositoryToken(Book));
      (repo.findOneBy as jest.Mock).mockResolvedValue(existingBook);

      const result = await service.resolveBook(isbn);
      expect(result).toEqual(existingBook);
      // createQueryBuilder should not be called if found initially
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should create new book using INSERT IGNORE if not found', async () => {
      const isbn = '456';
      const newBook = { isbn: '456', title: 'New' };

      const repo = module.get(getRepositoryToken(Book));
      mockNaverBookSearchService.search.mockResolvedValue([newBook]);

      // Mock query builder for insert
      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockInsertBuilder);

      // 1. Initial find: null
      (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      (repo.create as jest.Mock).mockReturnValue(newBook);

      const result = await service.resolveBook(isbn);

      expect(result).toEqual(newBook);
      expect(repo.findOneBy).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalled();
      expect(mockNaverBookSearchService.search).toHaveBeenCalledWith(isbn, 1);
      expect(mockInsertBuilder.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.orIgnore).toHaveBeenCalled();
      expect(mockInsertBuilder.execute).toHaveBeenCalled();
    });

    it('should return existing book if INSERT IGNORE was ignored (concurrent creation)', async () => {
      const isbn = '789';
      const existingBook = { isbn: '789', title: 'Concurrent' };

      const repo = module.get(getRepositoryToken(Book));
      mockNaverBookSearchService.search.mockResolvedValue([existingBook]);

      // Mock query builder for insert
      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        // Simulate insert being ignored (e.g., 0 affected rows)
        execute: jest.fn().mockResolvedValue({ raw: [], affected: 0 }),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockInsertBuilder);

      // 1. Initial find: null
      (repo.findOneBy as jest.Mock).mockResolvedValueOnce(null);
      (repo.create as jest.Mock).mockReturnValue(existingBook);

      const result = await service.resolveBook(isbn);

      expect(result).toEqual(existingBook);
      expect(mockInsertBuilder.insert).toHaveBeenCalled();
      expect(mockInsertBuilder.orIgnore).toHaveBeenCalled();
      expect(mockInsertBuilder.execute).toHaveBeenCalled();
      expect(repo.findOneBy).toHaveBeenCalledTimes(1); // Initial find only
    });
  });

  describe('findPopularBooks', () => {
    it('should execute query builder with subqueries', async () => {
      const repo = module.get(getRepositoryToken(Book));
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            isbn: '1',
            title: 'Pop',
            viewCount: 10,
            readingLogCount: 5,
            reviewCount: 5,
            wishlistCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await service.findPopularBooks();

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('book');
      // Subqueries are now string arguments, so we check if addSelect was called 3 times
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(1);
      expect(result[0].isbn).toBe('1');
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
