import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { UserService } from '@/features/user/services/user.service';

import { CreateBookSaleDto } from '../dtos/create-book-sale.dto';
import { UsedBookSale } from '../entities/used-book-sale.entity';
import { UsedBookSaleService } from './used-book-sale.service';

describe('UsedBookSaleService', () => {
  let service: UsedBookSaleService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const mockUsedBookSaleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(),
  };

  const mockBookService = {
    resolveBook: jest.fn(),
  };
  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    // 트랜잭션 매니저 Mock (하위 호환성 위해 유지하거나 제거)
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // DataSource.transaction Mock
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        return cb(mockManager) as Promise<any>;
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
            del: jest.fn(),
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
      isbn: '123',
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

    it('성공적으로 판매글을 생성해야 합니다', async () => {
      // 1. 판매글 생성 객체 리턴
      const expectedSale = {
        id: 1,
        ...createDto,
        isbn: undefined,
        book: { isbn: '123' },
      };
      mockUsedBookSaleRepository.create.mockReturnValue(expectedSale);
      mockUsedBookSaleRepository.save.mockResolvedValue(expectedSale);

      // 실행
      const result = await service.createUsedBookSale(createDto, userId);

      // 검증
      expect(result).toEqual(expectedSale);
      expect(mockUsedBookSaleRepository.create).toHaveBeenCalled();
      expect(mockUsedBookSaleRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
