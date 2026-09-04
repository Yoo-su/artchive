import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { In, OptimisticLockVersionMismatchError, Repository } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { TradeCompletionService } from '@/features/trade/services/trade-completion.service';
import {
  SaleStatus,
  TradeMethod,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { ACTIVE_ORDER_STATUSES } from '../constants';
import { CancelOrderDto } from '../dtos/cancel-order.dto';
import { ConfirmPaymentDto } from '../dtos/confirm-payment.dto';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { DisputeOrderDto } from '../dtos/dispute-order.dto';
import { QueryOrderDto } from '../dtos/query-order.dto';
import { RegisterShippingDto } from '../dtos/register-shipping.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { TossPaymentsService } from './toss-payments.service';

/**
 * 커밋된 뒤에 발행할 이벤트.
 *
 * 트랜잭션 안에서 발행하면 (1) 롤백된 주문에 대한 알림과 채팅 메시지가 남고,
 * (2) 소켓 브로드캐스트를 받은 화면이 아직 커밋되지 않은 주문을 다시 읽어간다.
 * 리스너는 트랜잭션 밖 레포지토리로 쓰기 때문에 롤백에 따라오지 않는다.
 *
 * 그래서 상태 변경은 `persist*` 프라이빗 메서드가 트랜잭션 안에서 하고,
 * 발행은 공개 메서드가 그 결과를 받아 커밋 뒤에 한다.
 */
interface PendingOrderEvent {
  name: string;
  payload: Record<string, unknown>;
}

/** 트랜잭션 안에서 처리한 주문과, 커밋 뒤에 발행할 이벤트 */
interface PersistedOrder {
  order: Order;
  event: PendingOrderEvent;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(UsedBookSale)
    private readonly saleRepository: Repository<UsedBookSale>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly tossPaymentsService: TossPaymentsService,
    private readonly tradeCompletionService: TradeCompletionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 판매자가 특정 구매자를 선택하여 주문을 생성합니다.
   * 판매글 상태를 RESERVED로 변경하고 24시간 결제 만료 시각을 설정합니다.
   */
  async selectBuyer(
    createOrderDto: CreateOrderDto,
    sellerId: number,
  ): Promise<Order> {
    const { order, event } = await this.persistSelectBuyer(
      createOrderDto,
      sellerId,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistSelectBuyer(
    createOrderDto: CreateOrderDto,
    sellerId: number,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;
    const { saleId, buyerId, chatRoomId } = createOrderDto;

    const sale = await manager.findOne(UsedBookSale, {
      where: { id: saleId },
      relations: ['user'],
    });

    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (sale.user.id !== sellerId) {
      throw new BusinessException('SALE_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (buyerId === sellerId) {
      throw new BusinessException(
        'ORDER_CANNOT_SELECT_SELF',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 직거래 전용 판매글에 대한 온라인 주문 차단
    if (sale.tradeMethod === TradeMethod.DIRECT_ONLY) {
      throw new BusinessException(
        'ORDER_DIRECT_ONLY_NOT_ALLOWED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sale.status !== SaleStatus.FOR_SALE) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 판매자 및 구매자 이메일 인증 여부 검증
    if (!sale.user.isEmailVerified) {
      throw new BusinessException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    // 구매자 탈퇴 여부 검증
    const buyer = await manager.findOne(User, {
      where: { id: buyerId },
    });

    if (!buyer || buyer.deletedAt !== null) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_INACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!buyer.isEmailVerified) {
      throw new BusinessException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    // 채팅방 참여자의 활성 상태 검증 (방을 나간 경우 차단)
    if (chatRoomId) {
      const buyerParticipant = await manager.findOne(ChatParticipant, {
        where: {
          chatRoom: { id: chatRoomId },
          user: { id: buyerId },
        },
      });

      if (!buyerParticipant || !buyerParticipant.isActive) {
        throw new BusinessException(
          'CHAT_PARTICIPANT_INACTIVE',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 이미 활성 상태인 주문이 있는지 검사
    const activeOrder = await manager.findOne(Order, {
      where: {
        saleId,
        status: In([...ACTIVE_ORDER_STATUSES]),
      },
    });

    if (activeOrder) {
      throw new BusinessException('ORDER_ALREADY_EXISTS', HttpStatus.CONFLICT);
    }

    const id = this.generateOrderNumber();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

    const order = manager.create(Order, {
      id,
      status: OrderStatus.AWAITING_PAYMENT,
      amount: sale.price,
      saleId: sale.id,
      buyerId,
      sellerId,
      chatRoomId: chatRoomId || null,
      expiresAt,
    });

    try {
      const savedOrder = await manager.save(Order, order);
      sale.status = SaleStatus.RESERVED;
      await manager.save(UsedBookSale, sale);

      const event: PendingOrderEvent = {
        name: 'order.buyer_selected',
        payload: {
          orderId: savedOrder.id,
          saleId: savedOrder.saleId,
          buyerId: savedOrder.buyerId,
          sellerId: savedOrder.sellerId,
          amount: savedOrder.amount,
          chatRoomId: savedOrder.chatRoomId,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 결제 전 단계에서 판매자가 구매자 선택을 취소합니다.
   * 주문을 CANCELLED로 변경하고 판매글 상태를 FOR_SALE로 복구합니다.
   */
  async cancelSelection(orderId: string, sellerId: number): Promise<Order> {
    const { order, event } = await this.persistCancelSelection(
      orderId,
      sellerId,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistCancelSelection(
    orderId: string,
    sellerId: number,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.sellerId !== sellerId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = '판매자 선택 취소';

    try {
      const savedOrder = await manager.save(Order, order);
      if (order.sale) {
        order.sale.status = SaleStatus.FOR_SALE;
        await manager.save(UsedBookSale, order.sale);
      }

      const event: PendingOrderEvent = {
        name: 'order.cancelled',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          chatRoomId: order.chatRoomId,
          reason: '판매자 선택 취소',
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 결제 완료 및 배송지 스냅샷을 저장합니다.
   * 금액 위변조 및 만료 여부를 검증하고 토스페이먼츠 승인 후 PAID 상태로 전이합니다.
   */
  async confirmPayment(
    orderId: string,
    buyerId: number,
    dto: ConfirmPaymentDto,
  ): Promise<Order> {
    const { order, event } = await this.persistConfirmPayment(
      orderId,
      buyerId,
      dto,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistConfirmPayment(
    orderId: string,
    buyerId: number,
    dto: ConfirmPaymentDto,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== buyerId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 구매자 이메일 인증 여부 검증
    const buyer = await manager.findOne(User, {
      where: { id: buyerId },
    });
    if (!buyer || !buyer.isEmailVerified) {
      throw new BusinessException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new BusinessException(
        'ORDER_PAYMENT_EXPIRED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.amount !== order.amount) {
      throw new BusinessException(
        'ORDER_AMOUNT_MISMATCH',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토스페이먼츠 승인 API 호출
    await this.tossPaymentsService.confirmPayment(
      dto.paymentKey,
      order.id,
      dto.amount,
    );

    order.status = OrderStatus.PAID;
    order.paymentKey = dto.paymentKey;
    order.recipientName = dto.recipientName;
    order.recipientPhone = dto.recipientPhone;
    order.zipCode = dto.zipCode;
    order.address = dto.address;
    order.addressDetail = dto.addressDetail || null;
    order.paidAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);

      const event: PendingOrderEvent = {
        name: 'order.payment_completed',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          amount: savedOrder.amount,
          chatRoomId: order.chatRoomId,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      // DB 저장 실패 시 이미 승인된 토스 결제에 대해 자동 환불(보상 트랜잭션) 수행
      try {
        await this.tossPaymentsService.cancelPayment(
          dto.paymentKey,
          '주문 저장 처리 중 시스템 오류로 인한 자동 취소',
          dto.amount,
        );
        this.logger.warn(
          `주문 ID ${order.id} DB 저장 실패로 인한 결제 자동 취소(보상 트랜잭션) 완료 (paymentKey: ${dto.paymentKey})`,
        );
      } catch (compensationError) {
        this.logger.error(
          `주문 ID ${order.id} 결제 승인 후 DB 실패에 따른 자동 환불(보상 트랜잭션) 실패 (paymentKey: ${dto.paymentKey}): ${(compensationError as Error).message}`,
        );
      }

      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 판매자가 운송장 번호를 등록하여 배송을 시작합니다. (PAID -> SHIPPED)
   */
  async registerShipping(
    orderId: string,
    sellerId: number,
    dto: RegisterShippingDto,
  ): Promise<Order> {
    const { order, event } = await this.persistRegisterShipping(
      orderId,
      sellerId,
      dto,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistRegisterShipping(
    orderId: string,
    sellerId: number,
    dto: RegisterShippingDto,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.sellerId !== sellerId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토스 에스크로 배송 정보 등록
    if (order.paymentKey) {
      await this.tossPaymentsService.registerShipping(
        order.paymentKey,
        dto.carrier,
        dto.trackingNumber,
      );
    }

    order.status = OrderStatus.SHIPPED;
    order.carrier = dto.carrier;
    order.trackingNumber = dto.trackingNumber;
    order.shippedAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);

      const event: PendingOrderEvent = {
        name: 'order.shipping_started',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          carrier: savedOrder.carrier,
          trackingNumber: savedOrder.trackingNumber,
          chatRoomId: order.chatRoomId,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 배송 완료를 기록합니다. (SHIPPED -> DELIVERED)
   */
  async markDelivered(orderId: string): Promise<Order> {
    const { order, event } = await this.persistMarkDelivered(orderId);
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistMarkDelivered(orderId: string): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);

      const event: PendingOrderEvent = {
        name: 'order.delivery_completed',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          chatRoomId: order.chatRoomId,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 구매자가 구매를 확정합니다. (DELIVERED/DISPUTED -> CONFIRMED)
   * 판매글 상태를 SOLD로 변경하고 토스 에스크로 구매확정을 요청합니다.
   */
  async confirmPurchase(orderId: string, buyerId: number): Promise<Order> {
    const { order, event } = await this.persistConfirmPurchase(
      orderId,
      buyerId,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistConfirmPurchase(
    orderId: string,
    buyerId: number,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== buyerId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.DISPUTED
    ) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토스 에스크로 구매확정 API 호출
    if (order.paymentKey) {
      await this.tossPaymentsService.confirmEscrowPurchase(order.paymentKey);
    }

    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);
      if (order.sale) {
        order.sale.status = SaleStatus.SOLD;
        order.sale.reservedForUserId = null;
        await manager.save(UsedBookSale, order.sale);
      }

      await this.recordCompletion(savedOrder);

      const event: PendingOrderEvent = {
        name: 'order.confirmed',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          chatRoomId: order.chatRoomId,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 구매자가 배송 완료 후 구매확정을 거부하고 분쟁을 제기합니다. (DELIVERED -> DISPUTED)
   */
  async disputeOrder(
    orderId: string,
    buyerId: number,
    dto: DisputeOrderDto,
  ): Promise<Order> {
    const { order, event } = await this.persistDisputeOrder(
      orderId,
      buyerId,
      dto,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistDisputeOrder(
    orderId: string,
    buyerId: number,
    dto: DisputeOrderDto,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== buyerId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토스 에스크로 구매거부 API 호출
    if (order.paymentKey) {
      await this.tossPaymentsService.rejectEscrowPurchase(
        order.paymentKey,
        dto.disputeReason,
      );
    }

    order.status = OrderStatus.DISPUTED;
    order.disputeReason = dto.disputeReason;
    order.disputedAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);

      const event: PendingOrderEvent = {
        name: 'order.disputed',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          chatRoomId: order.chatRoomId,
          disputeReason: savedOrder.disputeReason,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 주문을 취소합니다.
   * 배송 전(AWAITING_PAYMENT, PAID) 또는 DISPUTED 상태에서만 취소 가능합니다.
   * 배송 중(SHIPPED)에는 취소가 불가능합니다.
   * 결제 완료 상태인 경우 토스페이먼츠 결제 취소 API를 호출합니다.
   */
  async cancelOrder(
    orderId: string,
    userId: number,
    dto?: CancelOrderDto,
  ): Promise<Order> {
    const { order, event } = await this.persistCancelOrder(
      orderId,
      userId,
      dto,
    );
    this.eventEmitter.emit(event.name, event.payload);
    return order;
  }

  @Transactional()
  private async persistCancelOrder(
    orderId: string,
    userId: number,
    dto?: CancelOrderDto,
  ): Promise<PersistedOrder> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    if (order.status === OrderStatus.SHIPPED) {
      throw new BusinessException(
        'ORDER_CANNOT_CANCEL_SHIPPED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.DISPUTED
    ) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 이미 결제된 주문인 경우 토스 결제 취소 API 호출
    if (
      order.paymentKey &&
      (order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DISPUTED)
    ) {
      await this.tossPaymentsService.cancelPayment(
        order.paymentKey,
        dto?.cancelReason || '주문 취소',
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = dto?.cancelReason || '주문 취소';

    try {
      const savedOrder = await manager.save(Order, order);
      if (order.sale) {
        order.sale.status = SaleStatus.FOR_SALE;
        await manager.save(UsedBookSale, order.sale);
      }

      const event: PendingOrderEvent = {
        name: 'order.cancelled',
        payload: {
          orderId: savedOrder.id,
          saleId: order.saleId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          chatRoomId: order.chatRoomId,
          reason: savedOrder.cancelReason,
        },
      };

      return { order: savedOrder, event };
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 스케줄러/시스템에 의해 주문을 취소/환불 처리합니다.
   * 24시간 미결제 만료, 3일 미배송 환불, 7일 분쟁 만료 환불 시 호출됩니다.
   */
  @Transactional()
  async systemCancelOrder(orderId: string, reason: string): Promise<Order> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.status === OrderStatus.SHIPPED) {
      throw new BusinessException(
        'ORDER_CANNOT_CANCEL_SHIPPED',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      order.status !== OrderStatus.AWAITING_PAYMENT &&
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.DISPUTED
    ) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 결제된 주문인 경우 토스 결제 취소 호출
    if (
      order.paymentKey &&
      (order.status === OrderStatus.PAID ||
        order.status === OrderStatus.DISPUTED)
    ) {
      await this.tossPaymentsService.cancelPayment(order.paymentKey, reason);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = reason;

    try {
      const savedOrder = await manager.save(Order, order);
      if (order.sale) {
        order.sale.status = SaleStatus.FOR_SALE;
        await manager.save(UsedBookSale, order.sale);
      }
      return savedOrder;
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 스케줄러에 의해 자동으로 구매를 확정합니다. (배송 완료 후 2일 경과)
   */
  @Transactional()
  async autoConfirmPurchase(orderId: string): Promise<Order> {
    const manager = this.txHost.tx;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.DISPUTED
    ) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토스 에스크로 구매확정 API 호출
    if (order.paymentKey) {
      await this.tossPaymentsService.confirmEscrowPurchase(order.paymentKey);
    }

    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();

    try {
      const savedOrder = await manager.save(Order, order);
      if (order.sale) {
        order.sale.status = SaleStatus.SOLD;
        order.sale.reservedForUserId = null;
        await manager.save(UsedBookSale, order.sale);
      }

      await this.recordCompletion(savedOrder);

      return savedOrder;
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          'ORDER_CONCURRENT_MODIFICATION',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  /**
   * 구매확정된 주문의 거래 완료 기록을 남깁니다.
   *
   * 후기와 신뢰 지표는 결제 여부와 무관하게 완료 기록 하나만 바라보므로,
   * 택배 거래도 반드시 여기서 완료 기록을 만들어야 직거래와 같은 경로를 탑니다.
   */
  private async recordCompletion(order: Order): Promise<void> {
    await this.tradeCompletionService.recordDeliveryCompletion({
      saleId: order.saleId,
      sellerId: order.sellerId,
      buyerId: order.buyerId,
      chatRoomId: order.chatRoomId,
      orderId: order.id,
    });
  }

  /**
   * 주문 상세 정보를 조회합니다. (구매자 또는 판매자만 조회 가능)
   */
  async getOrder(orderId: string, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['sale', 'sale.book', 'buyer', 'seller', 'chatRoom'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 후기는 주문이 아니라 거래 완료 기록에 붙으므로, 후기 작성 진입에
    // 필요한 완료 기록 ID를 함께 실어준다.
    const completion = await this.tradeCompletionService.findByOrderId(
      order.id,
    );
    order.completionId = completion?.id ?? null;

    return order;
  }

  /**
   * 특정 채팅방의 활성 또는 가장 최근 주문 정보를 조회합니다.
   */
  async getActiveOrderByRoom(
    chatRoomId: number,
    userId: number,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: {
        chatRoomId,
        status: In([...ACTIVE_ORDER_STATUSES]),
      },
      relations: [
        'sale',
        'sale.book',
        'buyer',
        'seller',
        'chatRoom',
        'tradeReview',
      ],
      order: { createdAt: 'DESC' },
    });

    if (!order) {
      return null;
    }

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BusinessException('ORDER_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return order;
  }

  /**
   * 내 구매 주문 목록을 조회합니다.
   */
  async getMyPurchases(
    buyerId: number,
    query: QueryOrderDto,
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { buyerId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['sale', 'sale.book', 'seller', 'tradeReview'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { orders, total, page, limit };
  }

  /**
   * 내 판매 주문 목록을 조회합니다.
   */
  async getMySales(
    sellerId: number,
    query: QueryOrderDto,
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { sellerId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['sale', 'sale.book', 'buyer', 'tradeReview'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { orders, total, page, limit };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `ORD-${timestamp}-${randomSuffix}`;
  }
}
