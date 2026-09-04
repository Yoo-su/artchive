import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { In, Repository } from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ACTIVE_ORDER_STATUSES } from '@/features/order/constants';
import { Order } from '@/features/order/entities/order.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { REVIEW_EXPIRATION_MS } from '../constants';
import {
  TradeCompletion,
  TradeCompletionMethod,
} from '../entities/trade-completion.entity';
import { TradeReview } from '../entities/trade-review.entity';

@Injectable()
export class TradeCompletionService {
  constructor(
    @InjectRepository(TradeCompletion)
    private readonly tradeCompletionRepository: Repository<TradeCompletion>,
    @InjectRepository(TradeReview)
    private readonly tradeReviewRepository: Repository<TradeReview>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 판매자가 특정 구매희망자를 거래 상대로 지정하고 판매글을 예약중으로 바꿉니다.
   * 결제 없이 진행되는 직거래 전용 흐름입니다.
   */
  @Transactional()
  async reserveForBuyer(
    saleId: number,
    sellerId: number,
    buyerId: number,
    chatRoomId?: number | null,
  ): Promise<UsedBookSale> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    if (sale.status === SaleStatus.SOLD) {
      throw new BusinessException('SALE_ALREADY_SOLD', HttpStatus.CONFLICT);
    }

    if (buyerId === sellerId) {
      throw new BusinessException(
        'TRADE_BUYER_CANNOT_BE_SELLER',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sale.reservedForUserId && sale.reservedForUserId !== buyerId) {
      throw new BusinessException(
        'SALE_ALREADY_RESERVED_FOR_OTHER',
        HttpStatus.CONFLICT,
      );
    }

    await this.assertBuyerReachable(buyerId, chatRoomId);

    sale.status = SaleStatus.RESERVED;
    sale.reservedForUserId = buyerId;
    const saved = await manager.save(UsedBookSale, sale);

    this.eventEmitter.emit('trade.reserved', {
      saleId,
      sellerId,
      buyerId,
      chatRoomId: chatRoomId ?? null,
    });

    return saved;
  }

  /**
   * 예약을 취소하고 판매글을 다시 판매중으로 되돌립니다.
   */
  @Transactional()
  async cancelReservation(
    saleId: number,
    sellerId: number,
  ): Promise<UsedBookSale> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    if (sale.status !== SaleStatus.RESERVED) {
      throw new BusinessException('SALE_NOT_RESERVED', HttpStatus.BAD_REQUEST);
    }

    const previousBuyerId = sale.reservedForUserId;

    sale.status = SaleStatus.FOR_SALE;
    sale.reservedForUserId = null;
    const saved = await manager.save(UsedBookSale, sale);

    this.eventEmitter.emit('trade.reservation_cancelled', {
      saleId,
      sellerId,
      buyerId: previousBuyerId,
    });

    return saved;
  }

  /**
   * 직거래를 완료 처리합니다.
   *
   * 거래 상대를 넘기면 완료 기록이 남아 양쪽 모두 후기를 쓸 수 있고,
   * 넘기지 않으면 판매글만 판매완료로 바뀝니다. 서비스 밖에서 알게 된
   * 사람과 거래한 경우까지 막지 않기 위한 선택지입니다.
   */
  @Transactional()
  async completeDirectTrade(
    saleId: number,
    sellerId: number,
    buyerId?: number | null,
    chatRoomId?: number | null,
    withoutCounterparty?: boolean,
  ): Promise<{ sale: UsedBookSale; completion: TradeCompletion | null }> {
    const manager = this.txHost.tx;
    const sale = await this.loadSellerSale(saleId, sellerId);

    // 결제가 걸린 거래는 시스템이 구매확정 시점에 완료 처리한다.
    if (await this.hasActiveOrder(saleId)) {
      throw new BusinessException(
        'SALE_IN_TRADE_CANNOT_CHANGE_STATUS',
        HttpStatus.CONFLICT,
      );
    }

    // 이미 완료 기록이 있는 판매글은 다시 완료할 수 없다. 허용하면 한 거래를
    // 여러 건으로 부풀리거나(다른 상대로 재완료) 같은 거래가 중복 집계된다.
    const completedAlready = await manager.findOne(TradeCompletion, {
      where: { saleId },
    });
    if (completedAlready) {
      throw new BusinessException(
        'SALE_ALREADY_COMPLETED',
        HttpStatus.CONFLICT,
      );
    }

    const counterpartyId = withoutCounterparty
      ? null
      : (buyerId ?? sale.reservedForUserId);
    const roomId = chatRoomId ?? null;

    let completion: TradeCompletion | null = null;
    let isNewCompletion = false;

    if (counterpartyId) {
      if (counterpartyId === sellerId) {
        throw new BusinessException(
          'TRADE_BUYER_CANNOT_BE_SELLER',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.assertBuyerReachable(counterpartyId, roomId);

      // 위에서 판매글 단위 중복을 이미 막았으므로 여기서는 새로 만들기만 한다.
      isNewCompletion = true;
      completion = await manager.save(
        TradeCompletion,
        manager.create(TradeCompletion, {
          saleId,
          sellerId,
          buyerId: counterpartyId,
          chatRoomId: roomId,
          method: TradeCompletionMethod.DIRECT,
          orderId: null,
          completedAt: new Date(),
        }),
      );
    }

    sale.status = SaleStatus.SOLD;
    sale.reservedForUserId = null;
    const saved = await manager.save(UsedBookSale, sale);

    // 이미 완료된 거래를 다시 완료 처리해도 알림과 채팅 메시지는 한 번만
    // 나가야 한다. 기록은 멱등하지만 이벤트는 그렇지 않았다.
    if (completion && isNewCompletion) {
      this.eventEmitter.emit('trade.completed', {
        completionId: completion.id,
        saleId,
        sellerId,
        buyerId: completion.buyerId,
        chatRoomId: completion.chatRoomId,
        method: TradeCompletionMethod.DIRECT,
      });
    }

    return { sale: saved, completion };
  }

  /**
   * 에스크로 구매확정 시점에 택배 거래의 완료 기록을 남깁니다.
   *
   * 후기와 신뢰 지표가 결제 여부와 무관하게 같은 경로를 타도록,
   * 결제 거래도 반드시 완료 기록을 하나 남깁니다.
   */
  async recordDeliveryCompletion(params: {
    saleId: number;
    sellerId: number;
    buyerId: number;
    chatRoomId?: number | null;
    orderId: string;
  }): Promise<TradeCompletion> {
    const manager = this.txHost.tx ?? this.tradeCompletionRepository.manager;

    const existing = await manager.findOne(TradeCompletion, {
      where: { orderId: params.orderId },
    });
    if (existing) return existing;

    return await manager.save(
      TradeCompletion,
      manager.create(TradeCompletion, {
        saleId: params.saleId,
        sellerId: params.sellerId,
        buyerId: params.buyerId,
        chatRoomId: params.chatRoomId ?? null,
        method: TradeCompletionMethod.DELIVERY,
        orderId: params.orderId,
        completedAt: new Date(),
      }),
    );
  }

  /**
   * 내가 사거나 판 거래의 완료 내역.
   *
   * 직거래는 결제 기록이 없어서 주문 목록에 잡히지 않습니다. 채팅방을 나가거나
   * 대화가 묻히면 후기 작성 기한이 조용히 지나가므로, 거래를 한자리에서
   * 되짚고 후기를 남길 수 있는 목록이 필요합니다.
   */
  async findMyCompletions(
    userId: number,
    query: { role?: 'ALL' | 'BUYER' | 'SELLER'; page?: number; limit?: number },
  ): Promise<{
    completions: TradeCompletion[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { role = 'ALL', page = 1, limit = 10 } = query;

    const where =
      role === 'BUYER'
        ? [{ buyerId: userId }]
        : role === 'SELLER'
          ? [{ sellerId: userId }]
          : [{ buyerId: userId }, { sellerId: userId }];

    const [completions, total] =
      await this.tradeCompletionRepository.findAndCount({
        where,
        relations: ['sale', 'sale.book', 'seller', 'buyer'],
        order: { completedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    await this.decorateWithMyReview(completions, userId);

    return { completions, total, page, limit };
  }

  /**
   * 목록에 "내 역할 · 상대 · 내 후기 · 작성 가능 여부"를 붙입니다.
   * 후기는 건별로 조회하지 않고 한 번에 모아 N+1을 피합니다.
   */
  private async decorateWithMyReview(
    completions: TradeCompletion[],
    userId: number,
  ): Promise<void> {
    if (completions.length === 0) return;

    const myReviews = await this.tradeReviewRepository.find({
      where: {
        completionId: In(completions.map((completion) => completion.id)),
        reviewerId: userId,
      },
    });
    const reviewByCompletionId = new Map(
      myReviews.map((review) => [review.completionId, review]),
    );

    for (const completion of completions) {
      const isBuyer = completion.buyerId === userId;

      completion.myRole = isBuyer ? 'BUYER' : 'SELLER';
      completion.counterparty = isBuyer ? completion.seller : completion.buyer;

      const myReview = reviewByCompletionId.get(completion.id) ?? null;
      const deadline = new Date(
        new Date(completion.completedAt).getTime() + REVIEW_EXPIRATION_MS,
      );

      completion.myReview = myReview;
      completion.reviewExpiresAt = deadline;
      completion.canWriteReview = !myReview && deadline.getTime() > Date.now();
    }
  }

  /** 완료 기록 단건 조회 (거래 당사자만) */
  async findForParticipant(
    completionId: number,
    userId: number,
  ): Promise<TradeCompletion> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { id: completionId },
      relations: ['sale', 'sale.book', 'seller', 'buyer'],
    });

    if (!completion) {
      throw new BusinessException(
        'TRADE_COMPLETION_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (completion.sellerId !== userId && completion.buyerId !== userId) {
      throw new BusinessException(
        'TRADE_COMPLETION_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }

    return completion;
  }

  /** 주문으로 만들어진 완료 기록 (주문 화면의 후기 진입용) */
  async findByOrderId(orderId: string): Promise<TradeCompletion | null> {
    return await this.tradeCompletionRepository.findOne({
      where: { orderId },
    });
  }

  /** 특정 채팅방에서 성사된 완료 기록 (채팅방 배너용) */
  async findByChatRoom(
    chatRoomId: number,
    userId: number,
  ): Promise<TradeCompletion | null> {
    const completion = await this.tradeCompletionRepository.findOne({
      where: { chatRoomId },
      order: { completedAt: 'DESC' },
    });

    if (!completion) return null;
    if (completion.sellerId !== userId && completion.buyerId !== userId) {
      return null;
    }

    return completion;
  }

  /** 완료한 거래 수를 거래 방식별로 집계 (신뢰 지표용) */
  async countCompletionsAsSeller(sellerId: number): Promise<{
    direct: number;
    delivery: number;
    total: number;
  }> {
    const rows = await this.tradeCompletionRepository
      .createQueryBuilder('completion')
      .select('completion.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .where('completion.sellerId = :sellerId', { sellerId })
      .groupBy('completion.method')
      .getRawMany<{ method: TradeCompletionMethod; count: string }>();

    const countOf = (method: TradeCompletionMethod) =>
      Number(rows.find((row) => row.method === method)?.count ?? 0);

    const direct = countOf(TradeCompletionMethod.DIRECT);
    const delivery = countOf(TradeCompletionMethod.DELIVERY);

    return { direct, delivery, total: direct + delivery };
  }

  /**
   * 판매글에 대해 대화한 구매희망자 목록.
   *
   * 마이페이지에서 판매완료로 바꿀 때 "누구와 거래하셨나요?"를 묻기 위한
   * 후보 목록입니다. 채팅방을 나갔거나 탈퇴한 사람은 제외합니다.
   */
  async findTradeCandidates(
    saleId: number,
    sellerId: number,
  ): Promise<Array<{ user: User; chatRoomId: number }>> {
    await this.loadSellerSale(saleId, sellerId);

    const participants = await this.chatParticipantRepository
      .createQueryBuilder('participant')
      .innerJoinAndSelect('participant.user', 'user')
      .innerJoinAndSelect('participant.chatRoom', 'room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId })
      .andWhere('participant.isActive = true')
      .andWhere('user.id != :sellerId', { sellerId })
      .andWhere('user.deletedAt IS NULL')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    return participants.map((participant) => ({
      user: participant.user,
      chatRoomId: participant.chatRoom.id,
    }));
  }

  private async loadSellerSale(
    saleId: number,
    sellerId: number,
  ): Promise<UsedBookSale> {
    const manager = this.txHost.tx ?? this.usedBookSaleRepository.manager;

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

    return sale;
  }

  /**
   * 거래 상대로 지정하려는 사용자가 실제로 대화가 가능한 상대인지 확인합니다.
   *
   * 완료 기록은 후기와 신뢰 지표의 근거가 되므로, 아무나 상대로 넣어
   * 평판을 부풀리지 못하도록 같은 채팅방의 활성 참여자로 제한합니다.
   */
  private async assertBuyerReachable(
    buyerId: number,
    chatRoomId?: number | null,
  ): Promise<void> {
    if (!chatRoomId) return;

    const participant = await this.chatParticipantRepository.findOne({
      where: { chatRoom: { id: chatRoomId }, user: { id: buyerId } },
      relations: ['user'],
    });

    if (!participant || !participant.isActive) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_INACTIVE',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (participant.user?.deletedAt) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async hasActiveOrder(saleId: number): Promise<boolean> {
    const activeOrder = await this.orderRepository.findOne({
      where: { saleId, status: In([...ACTIVE_ORDER_STATUSES]) },
    });
    return !!activeOrder;
  }
}
