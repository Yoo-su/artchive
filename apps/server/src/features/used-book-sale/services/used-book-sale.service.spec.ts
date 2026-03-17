import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource, EntityManager } from 'typeorm';
import { UsedBookSaleService } from './used-book-sale.service';
import { UsedBookSale } from '../entities/used-book-sale.entity';
import { BookService } from '@/features/book/services/book.service';
import { UserService } from '@/features/user/services/user.service';
import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions';

describe('UsedBookSaleService', () => {
  let service: UsedBookSaleService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const mockUsedBookSaleRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
  };

  const mockBookService = {};
  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    // 트랜잭션 매니저 Mock
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // DataSource.transaction Mock
    // 실제 트랜잭션 로직을 시뮬레이션: 콜백 함수를 실행하면서 제공된 mockManager를 전달
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsedBookSaleService,
        {
          provide: getRepositoryToken(UsedBookSale),
          useValue: mockUsedBookSaleRepository,
        },
        { provide: BookService, useValue: mockBookService },
        { provide: UserService, useValue: mockUserService },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsedBookSaleService>(UsedBookSaleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUsedBookSale', () => {
    const userId = 1;
    const createDto: CreateBookSaleDto = {
      book: { isbn: '123' } as any,
      price: 10000,
      title: 'Test Sale',
      content: 'Content',
      city: 'Seoul',
      district: 'Gangnam',
      latitude: 0,
      longitude: 0,
      imageUrls: [],
      placeName: 'Test Place',
    };

    it('성공적으로 판매글을 생성해야 합니다 (트랜잭션 실행)', async () => {
      // 1. 유저 찾기 성공
      mockUserService.findById.mockResolvedValue({
        id: 1,
      } as User);

      // 2. 트랜잭션 내부 동작 시뮬레이션
      // 2-1. 책 찾기 (이미 존재한다고 가정)
      (mockManager.findOne as jest.Mock).mockResolvedValue({
        isbn: '123',
      } as Book);

      // 2-2. 판매글 생성 객체 리턴
      const expectedSale = { id: 1, ...createDto };
      (mockManager.create as jest.Mock).mockReturnValue(expectedSale);
      (mockManager.save as jest.Mock).mockResolvedValue(expectedSale);

      // 실행
      const result = await service.createUsedBookSale(createDto, userId);

      // 검증
      expect(result).toEqual(expectedSale);
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockDataSource.transaction).toHaveBeenCalled(); // 트랜잭션이 시작되었는지
      expect(mockManager.findOne).toHaveBeenCalledWith(Book, {
        where: { isbn: '123' },
      }); // 트랜잭션 매니저로 책을 찾았는지
      expect(mockManager.save).toHaveBeenCalledTimes(1); // 책은 이미 있어서 판매글만 save 호출
    });

    it('책이 없으면 새로 생성 후 판매글을 생성해야 합니다', async () => {
      mockUserService.findById.mockResolvedValue({
        id: 1,
      } as User);

      // 책이 없음
      (mockManager.findOne as jest.Mock).mockResolvedValue(null);
      // 책 생성 및 저장
      const newBook = { isbn: '123', title: 'New Book' };
      (mockManager.create as jest.Mock).mockImplementation((entity, data) => {
        if (entity === Book) return newBook;
        if (entity === UsedBookSale) return { id: 1, ...data } as UsedBookSale;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
      });
      (mockManager.save as jest.Mock).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        (entity, data) => data,
      );

      await service.createUsedBookSale(createDto, userId);

      // 책 한번, 판매글 한번 -> 총 2번 save 되어야 함
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('유저가 없으면 트랜잭션 시작 전에 실패해야 합니다', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.createUsedBookSale(createDto, userId),
      ).rejects.toThrow(BusinessException);

      expect(mockDataSource.transaction).not.toHaveBeenCalled(); // 트랜잭션은 아예 시작도 안 했어야 함
    });
  });
});
