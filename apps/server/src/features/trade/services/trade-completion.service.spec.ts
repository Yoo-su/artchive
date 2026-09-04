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
  let participantRepo: { createQueryBuilder: jest.Mock };
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

  /**
   * 거래 상대 검증용 채팅 참여자 조회(QueryBuilder)를 흉내낸다.
   *
   * 판매글 범위와 방 지정이 실제로 필터로 걸리는지 확인할 수 있도록,
   * where 파라미터를 모아 목록을 걸러 돌려준다.
   */
  const stubParticipants = (
    rows: Array<{
      roomId: number;
      isActive?: boolean;
      userId?: number;
      deletedAt?: Date | null;
    }>,
  ) => {
    const params: Record<string, number> = {};
    const query: Record<string, jest.Mock> = {};

    const collect = (_condition: string, values?: Record<string, number>) => {
      Object.assign(params, values ?? {});
      return query;
    };

    Object.assign(query, {
      innerJoinAndSelect: jest.fn(() => query),
      innerJoin: jest.fn(() => query),
      select: jest.fn(() => query),
      where: jest.fn(collect),
      andWhere: jest.fn(collect),
      orderBy: jest.fn(() => query),
      addOrderBy: jest.fn(() => query),
      getMany: jest.fn(() =>
        Promise.resolve(
          rows
            .filter(
              (row) => !params.chatRoomId || row.roomId === params.chatRoomId,
            )
            .filter((row) => (row.userId ?? BUYER_ID) === params.buyerId)
            .map((row) => ({
              id: row.roomId,
              isActive: row.isActive ?? true,
              chatRoom: { id: row.roomId },
              user: {
                id: row.userId ?? BUYER_ID,
                deletedAt: row.deletedAt ?? null,
              },
            })),
        ),
      ),
    });

    participantRepo.createQueryBuilder.mockReturnValue(query);
    return query;
  };

  /** manager.findOne이 엔티티별로 다른 값을 돌려주도록 세팅 */
  const stubManager = (opts: { sale?: unknown; completion?: unknown }) => {
    manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === UsedBookSale) return Promise.resolve(opts.sale ?? null);
      if (entity === TradeCompletion)
        return Promise.resolve(opts.completion ?? null);
      return Promise.resolve(null);
    });
  };

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
    participantRepo = { createQueryBuilder: jest.fn() };
    stubParticipants([{ roomId: ROOM_ID }]);
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
      stubParticipants([{ roomId: ROOM_ID }]);

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
        expect.objectContaining({
          saleId: SALE_ID,
          buyerId: BUYER_ID,
          chatRoomId: ROOM_ID,
        }),
      );
    });

    it('이 판매글로 대화한 적 없는 상대는 거래 상대로 지정할 수 없다', async () => {
      // 대화 이력을 요구하지 않으면 아무 사용자나 상대로 넣어 평판을 부풀리거나
      // 모르는 사람에게 거래 알림을 보낼 수 있다.
      manager.findOne.mockResolvedValue(mockSale());
      stubParticipants([]);

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('이 판매글의 채팅방이 아니면 거절한다', async () => {
      // 남의 방 ID를 넣어 거기에 거래 시스템 메시지를 심는 경로를 막는다.
      manager.findOne.mockResolvedValue(mockSale());
      stubParticipants([{ roomId: ROOM_ID }]);

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID, 999),
      ).rejects.toThrow(BusinessException);
    });

    it('탈퇴한 상대는 거래 상대로 지정할 수 없다', async () => {
      manager.findOne.mockResolvedValue(mockSale());
      stubParticipants([{ roomId: ROOM_ID, deletedAt: new Date() }]);

      await expect(
        service.reserveForBuyer(SALE_ID, SELLER_ID, BUYER_ID, ROOM_ID),
      ).rejects.toThrow(BusinessException);
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
      stubParticipants([{ roomId: ROOM_ID, isActive: false }]);

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
      stubManager({
        sale: mockSale({
          status: SaleStatus.RESERVED,
          reservedForUserId: BUYER_ID,
        }),
      });
      stubParticipants([{ roomId: ROOM_ID }]);

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
      stubManager({ sale: mockSale() });

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

    it('withoutCounterparty=true이면 예약 상대가 있어도 완료 기록을 남기지 않고 판매완료만 한다', async () => {
      stubManager({
        sale: mockSale({
          status: SaleStatus.RESERVED,
          reservedForUserId: BUYER_ID,
        }),
      });

      const { sale, completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        undefined,
        undefined,
        true,
      );

      expect(sale.status).toBe(SaleStatus.SOLD);
      expect(sale.reservedForUserId).toBeNull();
      expect(completion).toBeNull();
      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'trade.completed',
        expect.anything(),
      );
    });

    it('이미 완료된 판매글은 다시 완료할 수 없다', async () => {
      // 허용하면 한 거래를 여러 건으로 부풀리거나 중복 집계된다.
      stubManager({
        sale: mockSale({ status: SaleStatus.SOLD }),
        completion: { id: 7, saleId: SALE_ID, buyerId: BUYER_ID },
      });

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, BUYER_ID, ROOM_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('결제가 걸린 거래는 수동 완료 처리를 막는다', async () => {
      stubManager({ sale: mockSale() });
      orderRepo.findOne.mockResolvedValue({ id: 'ORD-1' });

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, BUYER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('자기 자신을 거래 상대로 지정할 수 없다', async () => {
      stubManager({ sale: mockSale() });

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, SELLER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('채팅방 ID를 넘기지 않아도 이 판매글의 방을 찾아 기록에 남긴다', async () => {
      stubManager({ sale: mockSale() });
      stubParticipants([{ roomId: ROOM_ID }]);

      const { completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        BUYER_ID,
      );

      expect(completion).toMatchObject({ chatRoomId: ROOM_ID });
    });

    it('대화한 적 없는 상대와는 완료 기록을 만들 수 없다', async () => {
      stubManager({ sale: mockSale() });
      stubParticipants([]);

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, BUYER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('상대가 채팅방을 나갔어도 완료는 할 수 있다', async () => {
      // 예약과 달리 완료는 이미 끝난 거래를 기록하는 것이라, 방을 나간 것만으로
      // 막으면 실제로 거래한 상대에게 후기를 남길 길이 사라진다.
      stubManager({ sale: mockSale() });
      stubParticipants([{ roomId: ROOM_ID, isActive: false }]);

      const { completion } = await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        BUYER_ID,
      );

      expect(completion).toMatchObject({
        buyerId: BUYER_ID,
        chatRoomId: ROOM_ID,
      });
    });

    it('탈퇴한 상대와는 완료 기록을 만들 수 없다', async () => {
      stubManager({ sale: mockSale() });
      stubParticipants([{ roomId: ROOM_ID, deletedAt: new Date() }]);

      await expect(
        service.completeDirectTrade(SALE_ID, SELLER_ID, BUYER_ID),
      ).rejects.toThrow(BusinessException);
    });

    it('상대를 지정하지 않고 완료해도 다른 채팅방에 알릴 이벤트는 나간다', async () => {
      // 예약 안내만 받은 구매희망자가 아무 소식 없이 남는 것을 막는다.
      stubManager({
        sale: mockSale({
          status: SaleStatus.RESERVED,
          reservedForUserId: BUYER_ID,
        }),
      });

      await service.completeDirectTrade(
        SALE_ID,
        SELLER_ID,
        undefined,
        undefined,
        true,
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'trade.sale_sold',
        expect.objectContaining({ saleId: SALE_ID, chatRoomId: null }),
      );
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
      const existing = { id: 5, saleId: SALE_ID, orderId: 'ORD-1' };
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

    it('같은 판매글의 다른 주문으로 완료 기록을 또 만들 수 없다', async () => {
      // 판매글당 완료 기록은 하나뿐이라, 걸러내지 않으면 DB 유니크 위반이
      // 에스크로 구매확정 호출 뒤에 500으로 터진다.
      manager.findOne.mockResolvedValue({
        id: 5,
        saleId: SALE_ID,
        orderId: 'ORD-1',
      });

      await expect(
        service.recordDeliveryCompletion({
          saleId: SALE_ID,
          sellerId: SELLER_ID,
          buyerId: BUYER_ID,
          orderId: 'ORD-2',
        }),
      ).rejects.toThrow(BusinessException);
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
