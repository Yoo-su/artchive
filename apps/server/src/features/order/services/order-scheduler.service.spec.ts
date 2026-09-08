import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Order, OrderStatus } from '../entities/order.entity';
import { DeliveryTrackerService } from './delivery-tracker.service';
import { OrderService } from './order.service';
import { OrderSchedulerService } from './order-scheduler.service';

describe('OrderSchedulerService', () => {
  let service: OrderSchedulerService;
  let mockOrderRepo: { find: jest.Mock };
  let mockOrderService: {
    systemCancelOrder: jest.Mock;
    autoConfirmPurchase: jest.Mock;
    markDelivered: jest.Mock;
  };
  let mockDeliveryTrackerService: {
    isDelivered: jest.Mock;
    getTrackingInfo: jest.Mock;
  };
  let mockEventEmitter: { emit: jest.Mock };
  const originalPaymentFlag = process.env.FEATURE_PAYMENT_ENABLED;

  // 스케줄러는 결제 플래그가 꺼져 있으면 전부 조기 반환한다.
  beforeAll(() => {
    process.env.FEATURE_PAYMENT_ENABLED = 'true';
  });

  afterAll(() => {
    if (originalPaymentFlag === undefined) {
      delete process.env.FEATURE_PAYMENT_ENABLED;
    } else {
      process.env.FEATURE_PAYMENT_ENABLED = originalPaymentFlag;
    }
  });

  const mockOrder = (overrides?: Partial<Order>): Order =>
    ({
      id: 'ORD-TEST-001',
      status: OrderStatus.AWAITING_PAYMENT,
      amount: 15000,
      saleId: 10,
      buyerId: 2,
      sellerId: 1,
      expiresAt: new Date(Date.now() - 1000),
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      disputedAt: null,
      cancelledAt: null,
      carrier: 'CJ대한통운',
      trackingNumber: '1234567890',
      ...overrides,
    }) as Order;

  beforeEach(async () => {
    mockOrderRepo = {
      find: jest.fn(),
    };
    mockOrderService = {
      systemCancelOrder: jest.fn(),
      autoConfirmPurchase: jest.fn(),
      markDelivered: jest.fn(),
    };
    mockDeliveryTrackerService = {
      isDelivered: jest.fn(),
      getTrackingInfo: jest.fn(),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderSchedulerService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: DeliveryTrackerService,
          useValue: mockDeliveryTrackerService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<OrderSchedulerService>(OrderSchedulerService);
  });

  describe('handleExpiredOrders', () => {
    it('24시간 미결제 만료된 주문을 자동 취소하고 이벤트를 발행해야 한다', async () => {
      const orders = [
        mockOrder({ id: 'ORD-001' }),
        mockOrder({ id: 'ORD-002' }),
      ];

      mockOrderRepo.find.mockResolvedValue(orders);
      mockOrderService.systemCancelOrder.mockResolvedValue(orders[0]);

      const count = await service.handleExpiredOrders();

      expect(count).toBe(2);
      expect(mockOrderService.systemCancelOrder).toHaveBeenCalledTimes(2);
      expect(mockOrderService.systemCancelOrder).toHaveBeenCalledWith(
        'ORD-001',
        '결제 기한(24시간) 만료로 인한 자동 취소',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.expired',
        expect.objectContaining({ orderId: 'ORD-001' }),
      );
    });

    it('만료 대상 주문이 없으면 0을 반환해야 한다', async () => {
      mockOrderRepo.find.mockResolvedValue([]);

      const count = await service.handleExpiredOrders();

      expect(count).toBe(0);
      expect(mockOrderService.systemCancelOrder).not.toHaveBeenCalled();
    });

    it('특정 주문 취소 실패 시에도 다음 주문 처리를 계속해야 한다', async () => {
      const orders = [
        mockOrder({ id: 'ORD-001' }),
        mockOrder({ id: 'ORD-002' }),
      ];

      mockOrderRepo.find.mockResolvedValue(orders);
      mockOrderService.systemCancelOrder
        .mockRejectedValueOnce(new Error('Lock error'))
        .mockResolvedValueOnce(orders[1]);

      const count = await service.handleExpiredOrders();

      expect(count).toBe(1);
      expect(mockOrderService.systemCancelOrder).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleUnshippedOrders', () => {
    it('3일 미배송 주문을 자동 취소 및 환불하고 이벤트를 발행해야 한다', async () => {
      const unshippedOrder = mockOrder({
        id: 'ORD-003',
        status: OrderStatus.PAID,
        paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      });

      mockOrderRepo.find.mockResolvedValue([unshippedOrder]);
      mockOrderService.systemCancelOrder.mockResolvedValue(unshippedOrder);

      const count = await service.handleUnshippedOrders();

      expect(count).toBe(1);
      expect(mockOrderService.systemCancelOrder).toHaveBeenCalledWith(
        'ORD-003',
        '결제 후 3일 이내 미배송으로 인한 자동 취소 및 환불',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.unshipped_cancelled',
        expect.objectContaining({ orderId: 'ORD-003' }),
      );
    });
  });

  describe('handleAutoConfirm', () => {
    it('배송 완료 후 2일 경과한 주문을 자동 구매확정하고 이벤트를 발행해야 한다', async () => {
      const deliveredOrder = mockOrder({
        id: 'ORD-004',
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });

      mockOrderRepo.find.mockResolvedValue([deliveredOrder]);
      mockOrderService.autoConfirmPurchase.mockResolvedValue(deliveredOrder);

      const count = await service.handleAutoConfirm();

      expect(count).toBe(1);
      expect(mockOrderService.autoConfirmPurchase).toHaveBeenCalledWith(
        'ORD-004',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.auto_confirmed',
        expect.objectContaining({ orderId: 'ORD-004' }),
      );
    });
  });

  describe('handleExpiredDisputes', () => {
    it('7일 미해결 분쟁 주문을 자동 환불하고 이벤트를 발행해야 한다', async () => {
      const disputedOrder = mockOrder({
        id: 'ORD-005',
        status: OrderStatus.DISPUTED,
        disputedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      });

      mockOrderRepo.find.mockResolvedValue([disputedOrder]);
      mockOrderService.systemCancelOrder.mockResolvedValue(disputedOrder);

      const count = await service.handleExpiredDisputes();

      expect(count).toBe(1);
      expect(mockOrderService.systemCancelOrder).toHaveBeenCalledWith(
        'ORD-005',
        '분쟁 접수 후 7일 경과로 인한 자동 환불',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.dispute_expired_refunded',
        expect.objectContaining({ orderId: 'ORD-005' }),
      );
    });
  });

  describe('pollDeliveryStatus', () => {
    it('배송 완료가 확인된 주문에 대해 markDelivered를 호출해야 한다', async () => {
      const shippedOrder = mockOrder({
        id: 'ORD-006',
        status: OrderStatus.SHIPPED,
        carrier: 'CJ대한통운',
        trackingNumber: '1234567890',
      });

      mockOrderRepo.find.mockResolvedValue([shippedOrder]);
      mockDeliveryTrackerService.isDelivered.mockResolvedValue(true);
      mockOrderService.markDelivered.mockResolvedValue(shippedOrder);

      const count = await service.pollDeliveryStatus();

      expect(count).toBe(1);
      expect(mockDeliveryTrackerService.isDelivered).toHaveBeenCalledWith(
        'CJ대한통운',
        '1234567890',
      );
      expect(mockOrderService.markDelivered).toHaveBeenCalledWith('ORD-006');
    });

    it('배송이 아직 완료되지 않은 경우 markDelivered를 호출하지 않아야 한다', async () => {
      const shippedOrder = mockOrder({
        id: 'ORD-007',
        status: OrderStatus.SHIPPED,
        carrier: 'CJ대한통운',
        trackingNumber: '1234567890',
      });

      mockOrderRepo.find.mockResolvedValue([shippedOrder]);
      mockDeliveryTrackerService.isDelivered.mockResolvedValue(false);

      const count = await service.pollDeliveryStatus();

      expect(count).toBe(0);
      expect(mockOrderService.markDelivered).not.toHaveBeenCalled();
    });
  });

  describe('sendExpiryWarnings', () => {
    it('자동구매확정 D-1 및 배송기한 D-1 대상 주문에 경고 이벤트를 발송해야 한다', async () => {
      const autoConfirmWarningOrder = mockOrder({
        id: 'ORD-008',
        status: OrderStatus.DELIVERED,
      });

      const shippingWarningOrder = mockOrder({
        id: 'ORD-009',
        status: OrderStatus.PAID,
      });

      mockOrderRepo.find
        .mockResolvedValueOnce([autoConfirmWarningOrder])
        .mockResolvedValueOnce([shippingWarningOrder]);

      const result = await service.sendExpiryWarnings();

      expect(result).toEqual({
        autoConfirmWarnings: 1,
        shippingDeadlineWarnings: 1,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.auto_confirm_warning',
        expect.objectContaining({ orderId: 'ORD-008', remainingHours: 24 }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.shipping_deadline_warning',
        expect.objectContaining({ orderId: 'ORD-009', remainingHours: 24 }),
      );
    });
  });
});
