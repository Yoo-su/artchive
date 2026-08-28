import { SaleAuthor, UsedBookSale } from "../book-sale/types";

/**
 * 주문 상태를 나타내는 Enum
 */
export enum OrderStatus {
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CONFIRMED = "CONFIRMED",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}

/**
 * 거래 후기 태그 Enum
 */
export enum TradeReviewTag {
  // 긍정 태그 (5종)
  GOOD_CONDITION = "GOOD_CONDITION",           // 책 상태가 설명과 같아요
  FAST_RESPONSE = "FAST_RESPONSE",             // 응답이 빨라요
  FAST_SHIPPING = "FAST_SHIPPING",             // 배송이 빨라요
  METICULOUS_PACKAGING = "METICULOUS_PACKAGING", // 포장이 꼼꼼해요
  KIND_MANNER = "KIND_MANNER",                 // 친절하고 매너가 좋아요

  // 부정 태그 (4종)
  BAD_CONDITION = "BAD_CONDITION",             // 책 상태가 설명과 달라요
  SLOW_RESPONSE = "SLOW_RESPONSE",             // 응답이 느려요
  LATE_SHIPPING = "LATE_SHIPPING",             // 배송이 늦었어요
  POOR_PACKAGING = "POOR_PACKAGING",           // 포장이 부실해요
}

export const POSITIVE_TRADE_REVIEW_TAGS: TradeReviewTag[] = [
  TradeReviewTag.GOOD_CONDITION,
  TradeReviewTag.FAST_RESPONSE,
  TradeReviewTag.FAST_SHIPPING,
  TradeReviewTag.METICULOUS_PACKAGING,
  TradeReviewTag.KIND_MANNER,
];

export const NEGATIVE_TRADE_REVIEW_TAGS: TradeReviewTag[] = [
  TradeReviewTag.BAD_CONDITION,
  TradeReviewTag.SLOW_RESPONSE,
  TradeReviewTag.LATE_SHIPPING,
  TradeReviewTag.POOR_PACKAGING,
];

/**
 * 주문 데이터 구조
 */
export interface Order {
  id: string; // e.g. "ORD-1724800000-8F92A1"
  status: OrderStatus;
  amount: number;
  paymentKey: string | null;

  // 배송지 스냅샷
  recipientName: string | null;
  recipientPhone: string | null;
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;

  // 배송 정보
  carrier: string | null;
  trackingNumber: string | null;

  // 시각 필드
  expiresAt: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  confirmedAt: string | null;
  disputedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;

  // 사유
  disputeReason: string | null;
  cancelReason: string | null;

  // 관계 데이터
  saleId: number;
  sale?: UsedBookSale;
  buyerId: number;
  buyer?: SaleAuthor;
  sellerId: number;
  seller?: SaleAuthor;
  chatRoomId: number | null;
  tradeReview?: TradeReview | null;
}

/**
 * 거래 후기 데이터 구조
 */
export interface TradeReview {
  id: number;
  orderId: string;
  reviewerId: number;
  reviewer?: SaleAuthor;
  targetUserId: number;
  targetUser?: SaleAuthor;
  tags: TradeReviewTag[];
  content: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
}

/**
 * 판매자 거래 통계 데이터 구조
 */
export interface SellerTradeStats {
  totalCompletedSales: number;
  totalReviews: number;
  positiveRate: number; // 0 ~ 100 (%)
  tagCounts: Record<string, number>;
}

/**
 * 주문 생성 (구매자 선택) 파라미터
 */
export interface CreateOrderParams {
  saleId: number;
  buyerId: number;
  chatRoomId?: number;
}

/**
 * 결제 승인 확인 및 배송지 등록 파라미터
 */
export interface ConfirmPaymentParams {
  paymentKey: string;
  amount: number;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
}

/**
 * 운송장 등록 파라미터
 */
export interface RegisterShippingParams {
  carrier: string;
  trackingNumber: string;
}

/**
 * 구매확정 거부 (분쟁 제기) 파라미터
 */
export interface DisputeOrderParams {
  disputeReason: string;
}

/**
 * 주문 취소 파라미터
 */
export interface CancelOrderParams {
  cancelReason?: string;
}

/**
 * 내 주문 목록 조회 쿼리 파라미터
 */
export interface QueryOrderParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

/**
 * 주문 목록 조회 응답
 */
export interface GetOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 거래 후기 작성 파라미터
 */
export interface CreateTradeReviewParams {
  orderId: string;
  tags: TradeReviewTag[];
  content?: string;
}

/**
 * 거래 후기 수정 파라미터
 */
export interface UpdateTradeReviewParams {
  tags?: TradeReviewTag[];
  content?: string;
}

/**
 * 거래 후기 목록 조회 쿼리 파라미터
 */
export interface QueryTradeReviewParams {
  page?: number;
  limit?: number;
}

/**
 * 거래 후기 목록 조회 응답
 */
export interface GetTradeReviewsResponse {
  reviews: TradeReview[];
  total: number;
  page: number;
  limit: number;
}
