import { TradeReviewTag } from '@bookjeok/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import {
  TradeCompletion,
  TradeCompletionMethod,
} from '../entities/trade-completion.entity';
import { TradeReview } from '../entities/trade-review.entity';
import { TradeReviewService } from './trade-review.service';

describe('TradeReviewService', () => {
  const SELLER_ID = 1;
  const BUYER_ID = 2;
  const STRANGER_ID = 99;
  const COMPLETION_ID = 10;

  let service: TradeReviewService;
  let reviewRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let completionRepo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let userRepo: { findOne: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const mockCompletion = (
    overrides?: Partial<TradeCompletion>,
  ): TradeCompletion =>
    ({
      id: COMPLETION_ID,
      saleId: 100,
      sellerId: SELLER_ID,
      buyerId: BUYER_ID,
      chatRoomId: 5,
      method: TradeCompletionMethod.DIRECT,
      orderId: null,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      ...overrides,
    }) as TradeCompletion;

  const mockCompletionQueryBuilder = (
    rows: Array<{ method: TradeCompletionMethod; count: string }>,
  ) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  });

  beforeEach(async () => {
    reviewRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest
        .fn()
        .mockImplementation((data: object) => ({ ...data, id: 500 })),
      save: jest
        .fn()
        .mockImplementation((data: object) => Promise.resolve(data)),
    };
    completionRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => mockCompletionQueryBuilder([])),
    };
    userRepo = { findOne: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeReviewService,
        { provide: getRepositoryToken(TradeReview), useValue: reviewRepo },
        {
          provide: getRepositoryToken(TradeCompletion),
          useValue: completionRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(TradeReviewService);
  });

  describe('createReview', () => {
    it('구매자는 판매자에게 후기를 쓸 수 있다', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue(null);

      const review = await service.createReview(BUYER_ID, {
        completionId: COMPLETION_ID,
        tags: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.KIND_MANNER],
        content: '좋은 거래였습니다.',
      });

      expect(review).toMatchObject({
        completionId: COMPLETION_ID,
        reviewerId: BUYER_ID,
        targetUserId: SELLER_ID,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trade_review.created',
        expect.objectContaining({ targetUserId: SELLER_ID }),
      );
    });

    it('판매자도 구매자에게 후기를 쓸 수 있다 (양방향)', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue(null);

      const review = await service.createReview(SELLER_ID, {
        completionId: COMPLETION_ID,
        tags: [TradeReviewTag.SMOOTH_TRADE],
      });

      expect(review).toMatchObject({
        reviewerId: SELLER_ID,
        targetUserId: BUYER_ID,
      });
    });

    it('거래 당사자가 아니면 쓸 수 없다', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());

      await expect(
        service.createReview(STRANGER_ID, {
          completionId: COMPLETION_ID,
          tags: [TradeReviewTag.KIND_MANNER],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('직거래에는 배송·포장 태그를 쓸 수 없다', async () => {
      completionRepo.findOne.mockResolvedValue(
        mockCompletion({ method: TradeCompletionMethod.DIRECT }),
      );
      reviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(BUYER_ID, {
          completionId: COMPLETION_ID,
          tags: [TradeReviewTag.FAST_SHIPPING],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('택배 거래에는 배송 태그를 쓸 수 있다', async () => {
      completionRepo.findOne.mockResolvedValue(
        mockCompletion({
          method: TradeCompletionMethod.DELIVERY,
          orderId: 'ORD-1',
        }),
      );
      reviewRepo.findOne.mockResolvedValue(null);

      const review = await service.createReview(BUYER_ID, {
        completionId: COMPLETION_ID,
        tags: [TradeReviewTag.FAST_SHIPPING],
      });

      expect(review.tags).toContain(TradeReviewTag.FAST_SHIPPING);
    });

    it('구매자를 평가하는 태그로 판매자를 평가할 수 없다', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(BUYER_ID, {
          completionId: COMPLETION_ID,
          tags: [TradeReviewTag.NO_SHOW],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('같은 거래에 두 번 쓸 수 없다', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.createReview(BUYER_ID, {
          completionId: COMPLETION_ID,
          tags: [TradeReviewTag.KIND_MANNER],
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('거래 완료 후 14일이 지나면 쓸 수 없다', async () => {
      completionRepo.findOne.mockResolvedValue(
        mockCompletion({
          completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        }),
      );

      await expect(
        service.createReview(BUYER_ID, {
          completionId: COMPLETION_ID,
          tags: [TradeReviewTag.KIND_MANNER],
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getSellerStats', () => {
    it('직거래와 택배 거래 건수를 나눠서 집계한다', async () => {
      userRepo.findOne.mockResolvedValue({ id: SELLER_ID } as User);
      completionRepo.createQueryBuilder.mockReturnValue(
        mockCompletionQueryBuilder([
          { method: TradeCompletionMethod.DIRECT, count: '12' },
          { method: TradeCompletionMethod.DELIVERY, count: '3' },
        ]),
      );
      reviewRepo.find.mockResolvedValue([
        { tags: [TradeReviewTag.KIND_MANNER] },
        { tags: [TradeReviewTag.BAD_CONDITION] },
      ]);

      const stats = await service.getSellerStats('seller');

      expect(stats).toMatchObject({
        directCompletedSales: 12,
        deliveryCompletedSales: 3,
        totalCompletedSales: 15,
        totalReviews: 2,
        positiveRate: 50,
      });
    });

    it('후기가 없으면 긍정 비율은 100으로 둔다', async () => {
      userRepo.findOne.mockResolvedValue({ id: SELLER_ID } as User);
      reviewRepo.find.mockResolvedValue([]);

      const stats = await service.getSellerStats('seller');

      expect(stats.totalReviews).toBe(0);
      expect(stats.positiveRate).toBe(100);
    });
  });

  describe('getMyReviewEligibility', () => {
    it('아직 안 썼고 기한이 남았으면 작성 가능', async () => {
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue(null);

      const result = await service.getMyReviewEligibility(
        COMPLETION_ID,
        BUYER_ID,
      );

      expect(result.canWrite).toBe(true);
      expect(result.myReview).toBeNull();
      expect(result.expiresAt).not.toBeNull();
    });

    it('이미 썼으면 작성 불가하고 기존 후기를 돌려준다', async () => {
      const existing = { id: 3 };
      completionRepo.findOne.mockResolvedValue(mockCompletion());
      reviewRepo.findOne.mockResolvedValue(existing);

      const result = await service.getMyReviewEligibility(
        COMPLETION_ID,
        BUYER_ID,
      );

      expect(result.canWrite).toBe(false);
      expect(result.myReview).toBe(existing);
    });
  });
});
