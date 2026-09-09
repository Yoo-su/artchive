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
  /**
   * 구매확정으로 생성된 거래 완료 기록 ID.
   * 후기는 완료 기록에 붙으므로 후기 작성 진입에 이 값을 씁니다.
   */
  completionId?: number | null;
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
