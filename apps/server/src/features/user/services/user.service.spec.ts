import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Order, OrderStatus } from '@/features/order/entities/order.entity';
import { Review } from '@/features/review/entities/review.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';
import { MailService } from '@/shared/mail/mail.service';

import { User } from '../entities/user.entity';
import { UserService } from './user.service';

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

describe('UserService', () => {
  let service: UserService;
  let mockManager: Partial<EntityManager>;
  let mockTxHost: { tx: Partial<EntityManager> };
  let mockEventEmitter: { emitAsync: jest.Mock };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockTxHost = {
      tx: mockManager,
    };

    mockEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(UsedBookSale), useValue: {} },
        { provide: getRepositoryToken(ChatParticipant), useValue: {} },
        { provide: getRepositoryToken(Review), useValue: {} },
        { provide: getRepositoryToken(Order), useValue: {} },
        {
          provide: getRepositoryToken(TradeCompletion),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        { provide: DataSource, useValue: { query: jest.fn() } },
        { provide: TransactionHost, useValue: mockTxHost },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('withdraw', () => {
    it('활성 주문(구매/판매)이 존재하는 경우 USER_IN_TRADE_CANNOT_WITHDRAW 예외를 던져야 합니다', async () => {
      // 0. 활성 주문 조회 결과 존재
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce({
        id: 1,
        status: OrderStatus.AWAITING_PAYMENT,
      });

      await expect(service.withdraw(1)).rejects.toThrow(BusinessException);
    });

    it('활성 주문이 없는 경우 회원을 익명화하고 이벤트를 발행해야 합니다', async () => {
      const user = {
        id: 1,
        nickname: '기존유저',
        email: 'test@example.com',
        deletedAt: null,
      };

      // 0. 활성 주문 없음
      // 1. 유저 조회
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(user);

      await service.withdraw(1);

      expect(user.nickname).toBe('(알수없음)');
      expect(user.deletedAt).toBeDefined();
      expect(mockManager.save).toHaveBeenCalledWith(user);
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        'user.withdrawn',
        expect.objectContaining({ userId: 1 }),
      );
    });
  });
});
