import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Order } from '@/features/order/entities/order.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import {
  TradeCompletion,
  TradeCompletionMethod,
} from '../entities/trade-completion.entity';
import { TradeReview } from '../entities/trade-review.entity';
import { TradeCompletionService } from './trade-completion.service';

// @Transactional은 CLS 컨텍스트를 요구하므로 단위 테스트에서는 통과시킨다.
jest.mock('@nestjs-cls/transactional', () => {
  const actual = jest.requireActual<Record<string, unknown>>(
    '@nestjs-cls/transactional',
  );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) =>
        descriptor,
  };
});

describe('TradeCompletionService', () => {
  const SELLER_ID = 1;
  const BUYER_ID = 2;
  const SALE_ID = 100;
  const ROOM_ID = 10;

  let service: TradeCompletionService;
  let manager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let completionRepo: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let reviewRepo: { find: jest.Mock };
  let saleRepo: { manager: unknown };
  let participantRepo: { findOne: jest.Mock };
  let orderRepo: { findOne: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  const mockSale = (overrides?: Partial<UsedBookSale>): UsedBookSale =>
    ({
      id: SALE_ID,
      status: SaleStatus.FOR_SALE,
      reservedForUserId: null,
      user: { id: SELLER_ID },
      ...overrides,
    }) as UsedBookSale;

  const mockActiveParticipant = () => ({
    isActive: true,
    user: { id: BUYER_ID, deletedAt: null },
  });

  beforeEach(async () => {
    manager = {
      findOne: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((_entity: unknown, data: object) => data),
      create: jest
        .fn()
        .mockImplementation((_entity: unknown, data: object) => ({ ...data })),
    };

    completionRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn(),
    };
    reviewRepo = { find: jest.fn().mockResolvedValue([]) };
    saleRepo = { manager };
    participantRepo = { findOne: jest.fn() };
    orderRepo = { findOne: jest.fn().mockResolvedValue(null) };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeCompletionService,
        {
          provide: getRepositoryToken(TradeCompletion),
          useValue: completionRepo,
        },
        { provide: getRepositoryToken(TradeReview), useValue: reviewRepo },
        { provide: getRepositoryToken(UsedBookSale), useValue: saleRepo },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: participantRepo,
        },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: TransactionHost, useValue: { tx: manager } },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(TradeCompletionService);
  });

  describe('reserveForBuyer', () => {
    it('거래 상대를 지정하면 예약중으로 바뀌고 상대가 기록된다', async () => {
      manager.findOne.mockResolvedValue(mockSale());
      participantRepo.findOne.mockResolvedValue(mockActiveParticipant());

      const result = await service.reserveForBuyer(
        SALE_ID,
        SELLER_ID,
        BUYER_ID,
        ROOM_ID,
      );

      expect(result.status).toBe(SaleStatus.RESERVED);
      expect(result.reservedForUserId).toBe(BUYER_ID);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trade.reserved',
        expect.objectContaining({ saleId: SALE_ID, buyerId: BUYER_ID }),
      );
    });

    it('이미 다른 구매자와 예약된 판매글은 거절한다', async () => {
      manager.findOne.mockResolvedValue(
        mockSale({ status: SaleStatus.RESERVED, reservedForUserId: 999 }),
      );

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID, ROOM_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('판매글 주인이 아니면 거절한다', async () => {
      manager.findOne.mockResolvedValue(
        mockSale({ user: { id: 999 } as never }),
      );

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID, ROOM_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('채팅방을 나간 상대는 거래 상대로 지정할 수 없다', async () => {
      manager.findOne.mockResolvedValue(mockSale());
      participantRepo.findOne.mockResolvedValue({
        isActive: false,
        user: { id: BUYER_ID, deletedAt: null },
      });

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID, ROOM_ID),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('cancelReservation', () => {
    it('예약을 취소하면 판매중으로 돌아오고 상대 기록이 지워진다', async () => {
      manager.findOne.mockResolvedValue(
        mockSale({ status: SaleStatus.RESERVED, reservedForUserId: BUYER_ID }),
      );

      const result = await service.cancelReservation(SALE_ID, SELLER_ID);

      expect(result.status).toBe(SaleStatus.FOR_SALE);
      expect(result.reservedForUserId).toBeNull();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trade.reservation_cancelled',
        expect.objectContaining({ buyerId: BUYER_ID }),
      );
    });

    it('예약중이 아니면 거절한다', async () => {
      manager.findOne.mockResolvedValue(mockSale());

      await expect(
        service.cancelReservation(SALE_ID, SELLER_ID),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('completeDirectTrade', () => {
    it('예약 상대가 있으면 완료 기록을 남기고 판매완료로 바꾼다', async () => {
      manager.findOne
        .mockResolvedValueOnce(
          mockSale({
            status: SaleStatus.RESERVED,
            reservedForUserId: BUYER_ID,
          }),
        )
        .mockResolvedValueOnce(null); // 기존 완료 기록 없음
      participantRepo.findOne.mockResolvedValue(mockActiveParticipant());

      const { sale, completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        undefined,
        ROOM_ID,
      );

      expect(sale.status).toBe(SaleStatus.SOLD);
      expect(sale.reservedForUserId).toBeNull();
      expect(completion).toMatchObject({
        saleId: SALE_ID,
        sellerId: SELLER_ID,
        buyerId: BUYER_ID,
        method: TradeCompletionMethod.DIRECT,
        orderId: null,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trade.completed',
        expect.objectContaining({ buyerId: BUYER_ID }),
      );
    });

    it('거래 상대가 없으면 판매완료만 하고 완료 기록은 남기지 않는다', async () => {
      manager.findOne.mockResolvedValue(mockSale());

      const { sale, completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
      );

      expect(sale.status).toBe(SaleStatus.SOLD);
      expect(completion).toBeNull();
      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'trade.completed',
        expect.anything(),
      );
    });

    it('같은 상대와 이미 완료 기록이 있으면 새로 만들지 않는다', async () => {
      const existing = { id: 7, saleId: SALE_ID, buyerId: BUYER_ID };
      manager.findOne
        .mockResolvedValueOnce(
          mockSale({
            status: SaleStatus.RESERVED,
            reservedForUserId: BUYER_ID,
          }),
        )
        .mockResolvedValueOnce(existing);
      participantRepo.findOne.mockResolvedValue(mockActiveParticipant());

      const { completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        undefined,
        ROOM_ID,
      );

      expect(completion).toBe(existing);
      expect(manager.create).not.toHaveBeenCalledWith(
        TradeCompletion,
        expect.anything(),
      );
    });

    it('이미 완료된 거래를 다시 완료해도 이벤트는 한 번만 나간다', async () => {
      // 기록은 멱등했지만 이벤트가 그렇지 않아 채팅 메시지와 알림이 중복됐다.
      const existing = { id: 7, saleId: SALE_ID, buyerId: BUYER_ID };
      manager.findOne
        .mockResolvedValueOnce(
          mockSale({
            status: SaleStatus.RESERVED,
            reservedForUserId: BUYER_ID,
          }),
        )
        .mockResolvedValueOnce(existing);
      participantRepo.findOne.mockResolvedValue(mockActiveParticipant());

      await service.completeDirectTrade(SALE_ID, SELLER_ID, undefined, ROOM_ID);

      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'trade.completed',
        expect.anything(),
      );
    });

    it('결제가 걸린 거래는 수동 완료 처리를 막는다', async () => {
      manager.findOne.mockResolvedValue(mockSale());
      orderRepo.findOne.mockResolvedValue({ id: 'ORD-1' });

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, BUYER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('자기 자신을 거래 상대로 지정할 수 없다', async () => {
      manager.findOne.mockResolvedValue(mockSale());

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, SELLER_ID),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('findMyCompletions', () => {
    const completionRow = (overrides?: Partial<TradeCompletion>) =>
      ({
        id: 1,
        saleId: 100,
        sellerId: SELLER_ID,
        buyerId: BUYER_ID,
        seller: { id: SELLER_ID, nickname: '판매자' },
        buyer: { id: BUYER_ID, nickname: '구매자' },
        method: TradeCompletionMethod.DIRECT,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ...overrides,
      }) as TradeCompletion;

    it('구매자로 조회하면 상대는 판매자이고 후기를 쓸 수 있다', async () => {
      completionRepo.findAndCount.mockResolvedValue([[completionRow()], 1]);

      const { completions } = await service.findMyCompletions(BUYER_ID, {});

      expect(completions[0].myRole).toBe('BUYER');
      expect(completions[0].counterparty).toMatchObject({ id: SELLER_ID });
      expect(completions[0].canWriteReview).toBe(true);
      expect(completions[0].myReview).toBeNull();
    });

    it('판매자로 조회하면 상대는 구매자다', async () => {
      completionRepo.findAndCount.mockResolvedValue([[completionRow()], 1]);

      const { completions } = await service.findMyCompletions(SELLER_ID, {});

      expect(completions[0].myRole).toBe('SELLER');
      expect(completions[0].counterparty).toMatchObject({ id: BUYER_ID });
    });

    it('이미 후기를 썼으면 다시 쓸 수 없다', async () => {
      completionRepo.findAndCount.mockResolvedValue([[completionRow()], 1]);
      reviewRepo.find.mockResolvedValue([{ id: 9, completionId: 1 }]);

      const { completions } = await service.findMyCompletions(BUYER_ID, {});

      expect(completions[0].canWriteReview).toBe(false);
      expect(completions[0].myReview).toMatchObject({ id: 9 });
    });

    it('완료 후 14일이 지나면 후기를 쓸 수 없다', async () => {
      completionRepo.findAndCount.mockResolvedValue([
        [
          completionRow({
            completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          }),
        ],
        1,
      ]);

      const { completions } = await service.findMyCompletions(BUYER_ID, {});

      expect(completions[0].canWriteReview).toBe(false);
    });

    it('역할 필터를 걸면 해당 방향만 조회한다', async () => {
      await service.findMyCompletions(BUYER_ID, { role: 'BUYER' });

      expect(completionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: [{ buyerId: BUYER_ID }] }),
      );
    });
  });

  describe('recordDeliveryCompletion', () => {
    it('같은 주문으로 두 번 호출해도 기록은 하나만 남는다', async () => {
      const existing = { id: 5, orderId: 'ORD-1' };
      manager.findOne.mockResolvedValue(existing);

      const result = await service.recordDeliveryCompletion({
        saleId: SALE_ID,
        sellerId: SELLER_ID,
        buyerId: BUYER_ID,
        orderId: 'ORD-1',
      });

      expect(result).toBe(existing);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('택배 거래 완료는 DELIVERY 방식으로 기록된다', async () => {
      manager.findOne.mockResolvedValue(null);

      const result = await service.recordDeliveryCompletion({
        saleId: SALE_ID,
        sellerId: SELLER_ID,
        buyerId: BUYER_ID,
        chatRoomId: ROOM_ID,
        orderId: 'ORD-2',
      });

      expect(result).toMatchObject({
        method: TradeCompletionMethod.DELIVERY,
        orderId: 'ORD-2',
      });
    });
  });
});
