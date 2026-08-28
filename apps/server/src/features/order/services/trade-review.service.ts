import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { CreateTradeReviewDto } from '../dtos/create-trade-review.dto';
import { QueryTradeReviewDto } from '../dtos/query-trade-review.dto';
import { UpdateTradeReviewDto } from '../dtos/update-trade-review.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { TradeReview, TradeReviewTag } from '../entities/trade-review.entity';

export interface SellerTradeStats {
  totalCompletedSales: number;
  totalReviews: number;
  positiveRate: number;
  tagCounts: Record<string, number>;
}

const POSITIVE_TAGS = new Set<string>([
  TradeReviewTag.GOOD_CONDITION,
  TradeReviewTag.FAST_RESPONSE,
  TradeReviewTag.FAST_SHIPPING,
  TradeReviewTag.METICULOUS_PACKAGING,
  TradeReviewTag.KIND_MANNER,
]);

const REVIEW_EXPIRATION_DAYS = 14;
const REVIEW_EXPIRATION_MS = REVIEW_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

@Injectable()
export class TradeReviewService {
  constructor(
    @InjectRepository(TradeReview)
    private readonly tradeReviewRepository: Repository<TradeReview>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 거래 후기를 작성합니다.
   * 구매확정된 주문의 구매자만 14일 이내에 작성 가능합니다.
   */
  async createReview(
    buyerId: number,
    dto: CreateTradeReviewDto,
  ): Promise<TradeReview> {
    const { orderId, tags, content } = dto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['tradeReview'],
    });

    if (!order) {
      throw new BusinessException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (order.buyerId !== buyerId) {
      throw new BusinessException(
        'TRADE_REVIEW_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BusinessException(
        'ORDER_INVALID_STATUS',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.tradeReview) {
      throw new BusinessException(
        'TRADE_REVIEW_ALREADY_EXISTS',
        HttpStatus.CONFLICT,
      );
    }

    // 14일 작성 기한 검증 (confirmedAt 또는 updatedAt 기준)
    const confirmedTime = order.confirmedAt || order.updatedAt;
    if (confirmedTime) {
      const isExpired =
        Date.now() - new Date(confirmedTime).getTime() > REVIEW_EXPIRATION_MS;
      if (isExpired) {
        throw new BusinessException(
          'TRADE_REVIEW_EXPIRED',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const review = this.tradeReviewRepository.create({
      orderId: order.id,
      reviewerId: buyerId,
      targetUserId: order.sellerId,
      tags,
      content: content || null,
    });

    const savedReview = await this.tradeReviewRepository.save(review);

    this.eventEmitter.emit('trade_review.created', {
      reviewId: savedReview.id,
      targetUserId: order.sellerId,
      reviewerId: buyerId,
      orderId: order.id,
    });

    return savedReview;
  }

  /**
   * 작성한 거래 후기를 수정합니다.
   * 작성자 본인만 14일 이내에 수정 가능합니다.
   */
  async updateReview(
    reviewId: number,
    userId: number,
    dto: UpdateTradeReviewDto,
  ): Promise<TradeReview> {
    const review = await this.tradeReviewRepository.findOne({
      where: { id: reviewId },
      relations: ['order'],
    });

    if (!review) {
      throw new BusinessException(
        'TRADE_REVIEW_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (review.reviewerId !== userId) {
      throw new BusinessException(
        'TRADE_REVIEW_FORBIDDEN',
        HttpStatus.FORBIDDEN,
      );
    }

    // 14일 작성 기한 검증 (order.confirmedAt 또는 review.createdAt 기준)
    const baseTime = review.order?.confirmedAt || review.createdAt;
    if (baseTime) {
      const isExpired =
        Date.now() - new Date(baseTime).getTime() > REVIEW_EXPIRATION_MS;
      if (isExpired) {
        throw new BusinessException(
          'TRADE_REVIEW_EXPIRED',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (dto.tags !== undefined) {
      review.tags = dto.tags;
    }

    if (dto.content !== undefined) {
      review.content = dto.content || null;
    }

    return await this.tradeReviewRepository.save(review);
  }

  /**
   * 특정 판매자가 받은 거래 후기 목록을 페이지네이션으로 조회합니다.
   */
  async getReviewsByTargetUser(
    handleOrId: string,
    query: QueryTradeReviewDto,
  ): Promise<{
    reviews: TradeReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const user = await this.findUserByHandleOrId(handleOrId);
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.tradeReviewRepository.findAndCount({
      where: { targetUserId: user.id },
      relations: ['reviewer', 'order', 'order.sale', 'order.sale.book'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { reviews, total, page, limit };
  }

  /**
   * 특정 판매자의 거래 통계 및 신뢰 지표를 집계합니다.
   */
  async getSellerStats(handleOrId: string): Promise<SellerTradeStats> {
    const user = await this.findUserByHandleOrId(handleOrId);

    const totalCompletedSales = await this.orderRepository.count({
      where: {
        sellerId: user.id,
        status: OrderStatus.CONFIRMED,
      },
    });

    const reviews = await this.tradeReviewRepository.find({
      where: { targetUserId: user.id },
    });

    const totalReviews = reviews.length;

    // 긍정 후기 비율 계산
    const positiveReviewCount = reviews.filter((review) =>
      review.tags?.some((tag) => POSITIVE_TAGS.has(tag)),
    ).length;

    const positiveRate =
      totalReviews === 0
        ? 100
        : Math.round((positiveReviewCount / totalReviews) * 100);

    // 태그별 빈도수 집계
    const tagCounts: Record<string, number> = {};
    Object.values(TradeReviewTag).forEach((tag) => {
      tagCounts[tag] = 0;
    });

    reviews.forEach((review) => {
      review.tags?.forEach((tag) => {
        if (tagCounts[tag] !== undefined) {
          tagCounts[tag]++;
        }
      });
    });

    return {
      totalCompletedSales,
      totalReviews,
      positiveRate,
      tagCounts,
    };
  }

  private async findUserByHandleOrId(handleOrId: string): Promise<User> {
    const isNumber = !Number.isNaN(Number(handleOrId));
    let user: User | null = null;

    if (isNumber) {
      user = await this.userRepository.findOne({
        where: [{ id: Number(handleOrId) }, { handle: handleOrId }],
      });
    } else {
      user = await this.userRepository.findOne({
        where: { handle: handleOrId },
      });
    }

    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
