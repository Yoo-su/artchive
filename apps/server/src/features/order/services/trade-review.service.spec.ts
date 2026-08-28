import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { Order, OrderStatus } from '../entities/order.entity';
import { TradeReview, TradeReviewTag } from '../entities/trade-review.entity';
import { TradeReviewService } from './trade-review.service';

describe('TradeReviewService', () => {
  let service: TradeReviewService;
  let mockTradeReviewRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let mockOrderRepo: {
    findOne: jest.Mock;
    count: jest.Mock;
  };
  let mockUserRepo: {
    findOne: jest.Mock;
  };
  let mockEventEmitter: {
    emit: jest.Mock;
  };

  const mockBuyerId = 2;
  const mockSellerId = 1;
  const mockOtherUserId = 99;

  const mockOrder = (overrides?: Partial<Order>): Order =>
    ({
      id: 'ORD-10',
      status: OrderStatus.CONFIRMED,
      buyerId: mockBuyerId,
      sellerId: mockSellerId,
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2일 전 확정
      tradeReview: null,
      ...overrides,
    }) as Order;

  const mockReview = (overrides?: Partial<TradeReview>): TradeReview =>
    ({
      id: 100,
      orderId: 'ORD-10',
      reviewerId: mockBuyerId,
      targetUserId: mockSellerId,
      tags: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_SHIPPING],
      content: '책 상태가 좋습니다.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      order: mockOrder(),
      ...overrides,
    }) as TradeReview;

  const mockUser = (overrides?: Partial<User>): User =>
    ({
      id: mockSellerId,
      handle: 'seller_handle',
      nickname: '판매자',
      ...overrides,
    }) as User;

  beforeEach(async () => {
    mockTradeReviewRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn().mockImplementation((data: Partial<TradeReview>) => ({
        ...data,
        id: 100,
      })),
      save: jest
        .fn()
        .mockImplementation((data: TradeReview) => Promise.resolve(data)),
    };

    mockOrderRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeReviewService,
        {
          provide: getRepositoryToken(TradeReview),
          useValue: mockTradeReviewRepo,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<TradeReviewService>(TradeReviewService);
  });

  describe('createReview', () => {
    it('구매확정 14일 이내 주문에 대해 후기를 정상 작성하고 이벤트를 발행해야 한다', async () => {
      const order = mockOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await service.createReview(mockBuyerId, {
        orderId: 'ORD-10',
        tags: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_SHIPPING],
        content: '책 상태가 좋습니다.',
      });

      expect(result).toBeDefined();
      expect(result.reviewerId).toBe(mockBuyerId);
      expect(result.targetUserId).toBe(mockSellerId);
      expect(result.tags).toEqual([
        TradeReviewTag.GOOD_CONDITION,
        TradeReviewTag.FAST_SHIPPING,
      ]);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'trade_review.created',
        expect.objectContaining({
          reviewId: 100,
          targetUserId: mockSellerId,
          reviewerId: mockBuyerId,
        }),
      );
    });

    it('주문이 존재하지 않으면 ORDER_NOT_FOUND 예외를 던진다', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(mockBuyerId, {
          orderId: 'ORD-999',
          tags: [TradeReviewTag.GOOD_CONDITION],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('구매자가 아닌 사용자가 후기 작성을 시도하면 TRADE_REVIEW_FORBIDDEN 예외를 던진다', async () => {
      const order = mockOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.createReview(mockOtherUserId, {
          orderId: 'ORD-10',
          tags: [TradeReviewTag.GOOD_CONDITION],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('구매확정(CONFIRMED) 상태가 아닌 주문은 후기를 작성할 수 없다', async () => {
      const order = mockOrder({ status: OrderStatus.PAID });
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.createReview(mockBuyerId, {
          orderId: 'ORD-10',
          tags: [TradeReviewTag.GOOD_CONDITION],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('이미 후기가 작성된 주문이면 TRADE_REVIEW_ALREADY_EXISTS 예외를 던진다', async () => {
      const order = mockOrder({ tradeReview: mockReview() });
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.createReview(mockBuyerId, {
          orderId: 'ORD-10',
          tags: [TradeReviewTag.GOOD_CONDITION],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('구매확정 후 14일이 초과된 주문이면 TRADE_REVIEW_EXPIRED 예외를 던진다', async () => {
      const order = mockOrder({
        confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15일 전
      });
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.createReview(mockBuyerId, {
          orderId: 'ORD-10',
          tags: [TradeReviewTag.GOOD_CONDITION],
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('updateReview', () => {
    it('작성자가 14일 이내에 후기 태그 및 내용을 수정할 수 있다', async () => {
      const review = mockReview();
      mockTradeReviewRepo.findOne.mockResolvedValue(review);

      const result = await service.updateReview(100, mockBuyerId, {
        tags: [TradeReviewTag.METICULOUS_PACKAGING],
        content: '수정된 후기 내용입니다.',
      });

      expect(result.tags).toEqual([TradeReviewTag.METICULOUS_PACKAGING]);
      expect(result.content).toBe('수정된 후기 내용입니다.');
      expect(mockTradeReviewRepo.save).toHaveBeenCalled();
    });

    it('존재하지 않는 후기 수정 시 TRADE_REVIEW_NOT_FOUND 예외를 던진다', async () => {
      mockTradeReviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateReview(999, mockBuyerId, { content: '수정' }),
      ).rejects.toThrow(BusinessException);
    });

    it('작성자가 아닌 사용자가 수정을 시도하면 TRADE_REVIEW_FORBIDDEN 예외를 던진다', async () => {
      const review = mockReview();
      mockTradeReviewRepo.findOne.mockResolvedValue(review);

      await expect(
        service.updateReview(100, mockOtherUserId, { content: '수정' }),
      ).rejects.toThrow(BusinessException);
    });

    it('작성 기한 14일이 초과된 경우 TRADE_REVIEW_EXPIRED 예외를 던진다', async () => {
      const review = mockReview({
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        order: mockOrder({
          confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        }),
      });
      mockTradeReviewRepo.findOne.mockResolvedValue(review);

      await expect(
        service.updateReview(100, mockBuyerId, { content: '수정' }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getReviewsByTargetUser', () => {
    it('특정 판매자의 후기 목록을 페이지네이션으로 조회한다', async () => {
      const user = mockUser();
      const reviews = [mockReview(), mockReview({ id: 101 })];

      mockUserRepo.findOne.mockResolvedValue(user);
      mockTradeReviewRepo.findAndCount.mockResolvedValue([reviews, 2]);

      const result = await service.getReviewsByTargetUser('seller_handle', {
        page: 1,
        limit: 10,
      });

      expect(result.reviews).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('존재하지 않는 유저 조회 시 USER_NOT_FOUND 예외를 던진다', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getReviewsByTargetUser('non_existent', { page: 1, limit: 10 }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getSellerStats', () => {
    it('판매자의 거래완료 건수, 후기 수, 긍정 비율, 태그별 통계를 정확히 집계한다', async () => {
      const user = mockUser();
      const reviews = [
        mockReview({
          id: 1,
          tags: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_SHIPPING],
        }),
        mockReview({
          id: 2,
          tags: [TradeReviewTag.SLOW_RESPONSE],
        }),
      ];

      mockUserRepo.findOne.mockResolvedValue(user);
      mockOrderRepo.count.mockResolvedValue(5); // 5건 거래완료
      mockTradeReviewRepo.find.mockResolvedValue(reviews);

      const stats = await service.getSellerStats('seller_handle');

      expect(stats.totalCompletedSales).toBe(5);
      expect(stats.totalReviews).toBe(2);
      expect(stats.positiveRate).toBe(50); // 2개 중 1개 긍정 = 50%
      expect(stats.tagCounts[TradeReviewTag.GOOD_CONDITION]).toBe(1);
      expect(stats.tagCounts[TradeReviewTag.FAST_SHIPPING]).toBe(1);
      expect(stats.tagCounts[TradeReviewTag.SLOW_RESPONSE]).toBe(1);
      expect(stats.tagCounts[TradeReviewTag.FAST_RESPONSE]).toBe(0);
    });

    it('후기가 0건인 경우 positiveRate는 100을 반환한다', async () => {
      const user = mockUser();
      mockUserRepo.findOne.mockResolvedValue(user);
      mockOrderRepo.count.mockResolvedValue(3);
      mockTradeReviewRepo.find.mockResolvedValue([]);

      const stats = await service.getSellerStats('seller_handle');

      expect(stats.totalCompletedSales).toBe(3);
      expect(stats.totalReviews).toBe(0);
      expect(stats.positiveRate).toBe(100);
    });
  });
});
