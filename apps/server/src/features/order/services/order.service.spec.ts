import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { EntityManager, Repository } from 'typeorm';

import {
  SaleStatus,
  TradeMethod,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { Order, OrderStatus } from '../entities/order.entity';
import { OrderService } from './order.service';
import { TossPaymentsService } from './toss-payments.service';

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

describe('OrderService', () => {
  let service: OrderService;
  let mockTxHost: { tx: Partial<EntityManager> };
  let mockManager: Partial<EntityManager>;
  let mockTossPaymentsService: Partial<TossPaymentsService>;
  let orderRepo: Partial<Repository<Order>>;
  let saleRepo: Partial<Repository<UsedBookSale>>;

  const mockSellerId = 1;
  const mockBuyerId = 2;
  const mockOtherUserId = 99;

  const createMockSale = (
    overrides: Partial<UsedBookSale> = {},
  ): UsedBookSale =>
    ({
      id: 100,
      title: '테스트 도서',
      price: 15000,
      status: SaleStatus.FOR_SALE,
      tradeMethod: TradeMethod.BOTH,
      user: { id: mockSellerId, isEmailVerified: true },
      ...overrides,
    }) as UsedBookSale;

  const createMockOrder = (overrides: Partial<Order> = {}): Order =>
    ({
      id: 'ORD-1234567890-TEST',
      status: OrderStatus.AWAITING_PAYMENT,
      amount: 15000,
      saleId: 100,
      buyerId: mockBuyerId,
      sellerId: mockSellerId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      sale: createMockSale({ status: SaleStatus.RESERVED }),
      ...overrides,
    }) as Order;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest
        .fn()
        .mockImplementation(
          (_entity: unknown, data: Record<string, unknown>): Order =>
            ({ ...data, id: 'ORD-1234567890-TEST' }) as unknown as Order,
        ),
      save: jest
        .fn()
        .mockImplementation(
          (_entity: unknown, data: unknown): Promise<unknown> =>
            Promise.resolve(data),
        ),
    };

    mockTxHost = {
      tx: mockManager,
    };

    mockTossPaymentsService = {
      confirmPayment: jest
        .fn()
        .mockResolvedValue({ status: 'DONE', paymentKey: 'toss_key' }),
      registerShipping: jest.fn().mockResolvedValue({ status: 'SHIPPING' }),
      confirmEscrowPurchase: jest
        .fn()
        .mockResolvedValue({ status: 'CONFIRMED' }),
      rejectEscrowPurchase: jest.fn().mockResolvedValue({ status: 'REJECTED' }),
      cancelPayment: jest.fn().mockResolvedValue({ status: 'CANCELED' }),
    };

    orderRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    saleRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepo,
        },
        {
          provide: getRepositoryToken(UsedBookSale),
          useValue: saleRepo,
        },
        {
          provide: TransactionHost,
          useValue: mockTxHost,
        },
        {
          provide: TossPaymentsService,
          useValue: mockTossPaymentsService,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('selectBuyer', () => {
    it('판매자가 구매자를 선택하면 AWAITING_PAYMENT 상태의 주문이 생성되고 판매글이 RESERVED 상태가 된다', async () => {
      const sale = createMockSale();
      const buyer = { id: mockBuyerId, deletedAt: null, isEmailVerified: true };
      const buyerParticipant = { id: 1, isActive: true };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(sale) // find sale
        .mockResolvedValueOnce(buyer) // find buyer user
        .mockResolvedValueOnce(buyerParticipant) // find buyer participant
        .mockResolvedValueOnce(null); // active order check

      const result = await service.selectBuyer(
        { saleId: 100, buyerId: mockBuyerId, chatRoomId: 10 },
        mockSellerId,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OrderStatus.AWAITING_PAYMENT);
      expect(result.amount).toBe(15000);
      expect(result.buyerId).toBe(mockBuyerId);
      expect(result.sellerId).toBe(mockSellerId);
      expect(result.chatRoomId).toBe(10);
      expect(sale.status).toBe(SaleStatus.RESERVED);
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('존재하지 않는 판매글인 경우 SALE_NOT_FOUND 예외를 던진다', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.selectBuyer(
          { saleId: 999, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('판매자 본인이 아닌 사용자가 선택을 시도하면 SALE_FORBIDDEN 예외를 던진다', async () => {
      const sale = createMockSale({
        user: { id: mockOtherUserId, isEmailVerified: true } as any,
      });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(sale);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('판매자가 이메일 미인증 상태인 경우 EMAIL_NOT_VERIFIED 예외를 던진다', async () => {
      const sale = createMockSale({
        user: { id: mockSellerId, isEmailVerified: false } as any,
      });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(sale);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('구매자가 이메일 미인증 상태인 경우 EMAIL_NOT_VERIFIED 예외를 던진다', async () => {
      const sale = createMockSale();
      const unverifiedBuyer = {
        id: mockBuyerId,
        deletedAt: null,
        isEmailVerified: false,
      };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(sale)
        .mockResolvedValueOnce(unverifiedBuyer);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('판매자가 자기 자신을 구매자로 선택하려 하면 ORDER_CANNOT_SELECT_SELF 예외를 던진다', async () => {
      const sale = createMockSale();
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(sale);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockSellerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('직거래 전용 판매글에 주문 생성을 시도하면 ORDER_DIRECT_ONLY_NOT_ALLOWED 예외를 던진다', async () => {
      const sale = createMockSale({ tradeMethod: TradeMethod.DIRECT_ONLY });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(sale);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('판매글 상태가 FOR_SALE이 아니면 ORDER_INVALID_STATUS 예외를 던진다', async () => {
      const sale = createMockSale({ status: SaleStatus.RESERVED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(sale);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('탈퇴한 회원에 대해 구매자 지정을 시도하면 CHAT_PARTICIPANT_INACTIVE 예외를 던진다', async () => {
      const sale = createMockSale();
      const withdrawnBuyer = {
        id: mockBuyerId,
        deletedAt: new Date(),
        isEmailVerified: true,
      };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(sale)
        .mockResolvedValueOnce(withdrawnBuyer);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('채팅방을 나간 사용자에 대해 구매자 지정을 시도하면 CHAT_PARTICIPANT_INACTIVE 예외를 던진다', async () => {
      const sale = createMockSale();
      const buyer = { id: mockBuyerId, deletedAt: null, isEmailVerified: true };
      const inactiveParticipant = { id: 1, isActive: false };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(sale)
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(inactiveParticipant);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId, chatRoomId: 10 },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('이미 해당 판매글에 활성 진행 중인 주문이 존재하면 ORDER_ALREADY_EXISTS 예외를 던진다', async () => {
      const sale = createMockSale();
      const buyer = { id: mockBuyerId, deletedAt: null, isEmailVerified: true };
      const activeOrder = createMockOrder();
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(sale)
        .mockResolvedValueOnce(buyer)
        .mockResolvedValueOnce(activeOrder);

      await expect(
        service.selectBuyer(
          { saleId: 100, buyerId: mockBuyerId },
          mockSellerId,
        ),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('cancelSelection', () => {
    it('판매자가 결제 전 구매자 선택을 취소하면 주문이 CANCELLED로 변경되고 판매글이 FOR_SALE로 복구된다', async () => {
      const order = createMockOrder({ sellerId: mockSellerId });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.cancelSelection(
        'ORD-1234567890-TEST',
        mockSellerId,
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(order.sale.status).toBe(SaleStatus.FOR_SALE);
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('판매자가 아닌 사용자가 선택 취소를 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder({ sellerId: mockSellerId });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.cancelSelection('ORD-1234567890-TEST', mockOtherUserId),
      ).rejects.toThrow(BusinessException);
    });

    it('주문이 AWAITING_PAYMENT 상태가 아니면 ORDER_INVALID_STATUS 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.cancelSelection('ORD-1234567890-TEST', mockSellerId),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('confirmPayment', () => {
    const paymentDto = {
      paymentKey: 'toss_pay_key_123',
      amount: 15000,
      recipientName: '홍길동',
      recipientPhone: '010-1234-5678',
      zipCode: '12345',
      address: '서울시 강남구 테헤란로 123',
      addressDetail: '101호',
    };

    it('구매자가 결제를 완료하면 금액 검증 후 PAID 상태로 전이되고 배송지 정보가 저장된다', async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_PAYMENT,
        amount: 15000,
      });
      const buyer = { id: mockBuyerId, isEmailVerified: true };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(buyer);

      const result = await service.confirmPayment(
        'ORD-1234567890-TEST',
        mockBuyerId,
        paymentDto,
      );

      expect(result.status).toBe(OrderStatus.PAID);
      expect(result.paymentKey).toBe(paymentDto.paymentKey);
      expect(result.recipientName).toBe(paymentDto.recipientName);
      expect(result.paidAt).toBeDefined();
    });

    it('구매자가 아닌 사용자가 결제 확인을 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder({ buyerId: mockBuyerId });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.confirmPayment(
          'ORD-1234567890-TEST',
          mockOtherUserId,
          paymentDto,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('구매자가 이메일 미인증 상태인 경우 EMAIL_NOT_VERIFIED 예외를 던진다', async () => {
      const order = createMockOrder({ buyerId: mockBuyerId });
      const unverifiedBuyer = { id: mockBuyerId, isEmailVerified: false };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(unverifiedBuyer);

      await expect(
        service.confirmPayment('ORD-1234567890-TEST', mockBuyerId, paymentDto),
      ).rejects.toThrow(BusinessException);
    });

    it('주문 금액과 결제 요청 금액이 일치하지 않으면 ORDER_AMOUNT_MISMATCH 예외를 던진다', async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_PAYMENT,
        amount: 15000,
      });
      const buyer = { id: mockBuyerId, isEmailVerified: true };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(buyer);

      await expect(
        service.confirmPayment('ORD-1234567890-TEST', mockBuyerId, {
          ...paymentDto,
          amount: 10000,
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('결제 기한(24시간)이 만료된 주문이면 ORDER_PAYMENT_EXPIRED 예외를 던진다', async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_PAYMENT,
        expiresAt: new Date(Date.now() - 1000), // 만료됨
      });
      const buyer = { id: mockBuyerId, isEmailVerified: true };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(buyer);

      await expect(
        service.confirmPayment('ORD-1234567890-TEST', mockBuyerId, paymentDto),
      ).rejects.toThrow(BusinessException);
    });

    it('토스 승인 후 DB 저장에 실패하면 보상 트랜잭션(토스 결제 자동 취소)을 호출해야 한다', async () => {
      const order = createMockOrder({
        status: OrderStatus.AWAITING_PAYMENT,
        amount: 15000,
      });
      const buyer = { id: mockBuyerId, isEmailVerified: true };
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(buyer);
      (mockManager.save as jest.Mock).mockRejectedValueOnce(
        new Error('DB Connection Error'),
      );

      await expect(
        service.confirmPayment('ORD-1234567890-TEST', mockBuyerId, paymentDto),
      ).rejects.toThrow('DB Connection Error');

      expect(mockTossPaymentsService.confirmPayment).toHaveBeenCalledWith(
        paymentDto.paymentKey,
        order.id,
        paymentDto.amount,
      );
      expect(mockTossPaymentsService.cancelPayment).toHaveBeenCalledWith(
        paymentDto.paymentKey,
        '주문 저장 처리 중 시스템 오류로 인한 자동 취소',
        paymentDto.amount,
      );
    });
  });

  describe('registerShipping', () => {
    it('판매자가 운송장 번호를 등록하면 SHIPPED 상태로 전이되고 배송 정보가 저장된다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.registerShipping(
        'ORD-1234567890-TEST',
        mockSellerId,
        {
          carrier: 'CJ대한통운',
          trackingNumber: '1234567890',
        },
      );

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(result.carrier).toBe('CJ대한통운');
      expect(result.trackingNumber).toBe('1234567890');
      expect(result.shippedAt).toBeDefined();
    });

    it('판매자가 아닌 사용자가 운송장 등록을 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.registerShipping('ORD-1234567890-TEST', mockOtherUserId, {
          carrier: 'CJ대한통운',
          trackingNumber: '1234567890',
        }),
      ).rejects.toThrow(BusinessException);
    });

    it('주문이 PAID 상태가 아니면 ORDER_INVALID_STATUS 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.AWAITING_PAYMENT });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.registerShipping('ORD-1234567890-TEST', mockSellerId, {
          carrier: 'CJ대한통운',
          trackingNumber: '1234567890',
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('markDelivered', () => {
    it('배송완료 시 DELIVERED 상태로 전이되고 deliveredAt이 기록된다', async () => {
      const order = createMockOrder({ status: OrderStatus.SHIPPED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.markDelivered('ORD-1234567890-TEST');

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(result.deliveredAt).toBeDefined();
    });

    it('주문이 SHIPPED 상태가 아니면 ORDER_INVALID_STATUS 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.markDelivered('ORD-1234567890-TEST'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('confirmPurchase', () => {
    it('구매자가 구매확정을 하면 CONFIRMED 상태로 전이되고 판매글이 SOLD 상태로 변경된다', async () => {
      const order = createMockOrder({ status: OrderStatus.DELIVERED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.confirmPurchase(
        'ORD-1234567890-TEST',
        mockBuyerId,
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.confirmedAt).toBeDefined();
      expect(order.sale.status).toBe(SaleStatus.SOLD);
    });

    it('분쟁(DISPUTED) 상태에서도 상호 합의 후 구매자가 구매확정할 수 있다', async () => {
      const order = createMockOrder({ status: OrderStatus.DISPUTED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.confirmPurchase(
        'ORD-1234567890-TEST',
        mockBuyerId,
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(order.sale.status).toBe(SaleStatus.SOLD);
    });

    it('구매자가 아닌 사용자가 구매확정을 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.DELIVERED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.confirmPurchase('ORD-1234567890-TEST', mockOtherUserId),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('disputeOrder', () => {
    it('구매자가 배송완료 후 이의를 제기하면 DISPUTED 상태로 전이되고 사유가 기록된다', async () => {
      const order = createMockOrder({ status: OrderStatus.DELIVERED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.disputeOrder(
        'ORD-1234567890-TEST',
        mockBuyerId,
        {
          disputeReason: '도서 상태 파손',
        },
      );

      expect(result.status).toBe(OrderStatus.DISPUTED);
      expect(result.disputeReason).toBe('도서 상태 파손');
      expect(result.disputedAt).toBeDefined();
    });

    it('배송완료(DELIVERED) 상태가 아니면 이의제기 시 ORDER_INVALID_STATUS 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.SHIPPED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.disputeOrder('ORD-1234567890-TEST', mockBuyerId, {
          disputeReason: '사유',
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('cancelOrder', () => {
    it('배송 전 단계(PAID)에서 취소하면 CANCELLED 상태로 전이되고 판매글이 FOR_SALE로 복구된다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.cancelOrder(
        'ORD-1234567890-TEST',
        mockBuyerId,
        {
          cancelReason: '단순 변심',
        },
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelReason).toBe('단순 변심');
      expect(order.sale.status).toBe(SaleStatus.FOR_SALE);
    });

    it('배송 중(SHIPPED) 상태에서는 주문을 취소할 수 없다 (ORDER_CANNOT_CANCEL_SHIPPED)', async () => {
      const order = createMockOrder({ status: OrderStatus.SHIPPED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.cancelOrder('ORD-1234567890-TEST', mockBuyerId),
      ).rejects.toThrow(BusinessException);
    });

    it('주문 당사자가 아닌 사용자가 취소를 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.PAID });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.cancelOrder('ORD-1234567890-TEST', mockOtherUserId),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getOrder', () => {
    it('구매자 또는 판매자가 주문 상세를 정상 조회할 수 있다', async () => {
      const order = createMockOrder();
      (orderRepo.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.getOrder('ORD-1234567890-TEST', mockBuyerId);

      expect(result).toBeDefined();
      expect(result.id).toBe('ORD-1234567890-TEST');
    });

    it('당사자가 아닌 제3자가 조회를 시도하면 ORDER_FORBIDDEN 예외를 던진다', async () => {
      const order = createMockOrder();
      (orderRepo.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.getOrder('ORD-1234567890-TEST', mockOtherUserId),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getMyPurchases & getMySales', () => {
    it('내 구매 주문 목록을 페이지네이션과 함께 조회할 수 있다', async () => {
      const orders = [createMockOrder(), createMockOrder({ id: 'ORD-201' })];
      (orderRepo.findAndCount as jest.Mock).mockResolvedValueOnce([orders, 2]);

      const result = await service.getMyPurchases(mockBuyerId, {
        page: 1,
        limit: 10,
      });

      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('내 판매 주문 목록을 페이지네이션과 함께 조회할 수 있다', async () => {
      const orders = [createMockOrder()];
      (orderRepo.findAndCount as jest.Mock).mockResolvedValueOnce([orders, 1]);

      const result = await service.getMySales(mockSellerId, {
        page: 1,
        limit: 10,
      });

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('systemCancelOrder', () => {
    it('미결제 주문을 시스템이 자동 취소하면 CANCELLED로 변경되고 판매글이 FOR_SALE로 복구된다', async () => {
      const order = createMockOrder({ status: OrderStatus.AWAITING_PAYMENT });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.systemCancelOrder(
        'ORD-1234567890-TEST',
        '결제 기한(24시간) 만료로 인한 자동 취소',
      );

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancelReason).toBe(
        '결제 기한(24시간) 만료로 인한 자동 취소',
      );
      expect(order.sale.status).toBe(SaleStatus.FOR_SALE);
    });

    it('결제 완료된 주문을 시스템이 취소하면 토스 결제 취소가 호출된다', async () => {
      const order = createMockOrder({
        status: OrderStatus.PAID,
        paymentKey: 'toss_payment_key',
      });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.systemCancelOrder(
        'ORD-1234567890-TEST',
        '3일 미배송 자동 취소 및 환불',
      );

      expect(mockTossPaymentsService.cancelPayment).toHaveBeenCalledWith(
        'toss_payment_key',
        '3일 미배송 자동 취소 및 환불',
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('배송 중(SHIPPED)인 주문은 시스템 취소할 수 없다', async () => {
      const order = createMockOrder({ status: OrderStatus.SHIPPED });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.systemCancelOrder('ORD-1234567890-TEST', '취소 시도'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('autoConfirmPurchase', () => {
    it('배송완료(DELIVERED) 주문을 자동 구매확정하면 CONFIRMED로 변경되고 판매글이 SOLD가 된다', async () => {
      const order = createMockOrder({
        status: OrderStatus.DELIVERED,
        paymentKey: 'toss_payment_key',
      });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.autoConfirmPurchase('ORD-1234567890-TEST');

      expect(
        mockTossPaymentsService.confirmEscrowPurchase,
      ).toHaveBeenCalledWith('toss_payment_key');
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(order.sale.status).toBe(SaleStatus.SOLD);
    });

    it('배송완료/분쟁 상태가 아닌 주문에 대해 자동확정을 시도하면 예외를 던진다', async () => {
      const order = createMockOrder({ status: OrderStatus.AWAITING_PAYMENT });
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(
        service.autoConfirmPurchase('ORD-1234567890-TEST'),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('getActiveOrderByRoom', () => {
    it('채팅방에 연결된 주문이 있으면 구매자 또는 판매자가 조회할 수 있다', async () => {
      const order = createMockOrder({
        chatRoomId: 10,
        buyerId: 2,
        sellerId: 1,
      });
      (orderRepo.findOne as jest.Mock).mockResolvedValueOnce(order);

      const result = await service.getActiveOrderByRoom(10, 2);
      expect(result).toBeDefined();
      expect(result?.chatRoomId).toBe(10);
    });

    it('채팅방에 연결된 주문이 없으면 null을 반환한다', async () => {
      (orderRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getActiveOrderByRoom(10, 2);
      expect(result).toBeNull();
    });

    it('당사자가 아닌 제3자가 조회하려 하면 예외를 던진다', async () => {
      const order = createMockOrder({
        chatRoomId: 10,
        buyerId: 2,
        sellerId: 1,
      });
      (orderRepo.findOne as jest.Mock).mockResolvedValueOnce(order);

      await expect(service.getActiveOrderByRoom(10, 999)).rejects.toThrow(
        BusinessException,
      );
    });
  });
});
