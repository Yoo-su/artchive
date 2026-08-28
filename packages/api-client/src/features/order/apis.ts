import {
  API_PATHS,
  CancelOrderParams,
  ConfirmPaymentParams,
  CreateOrderParams,
  CreateTradeReviewParams,
  DisputeOrderParams,
  GetOrdersResponse,
  GetTradeReviewsResponse,
  Order,
  QueryOrderParams,
  QueryTradeReviewParams,
  RegisterShippingParams,
  SellerTradeStats,
  TradeReview,
  UpdateTradeReviewParams,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 판매자가 구매자를 선택하여 주문을 생성합니다.
 */
export const selectBuyer = async (
  params: CreateOrderParams,
  options?: { idempotencyKey?: string },
): Promise<Order> => {
  const config = options?.idempotencyKey
    ? { headers: { "x-idempotency-key": options.idempotencyKey } }
    : undefined;
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.base,
    params,
    config,
  );
  return data;
};

/**
 * 결제 전 단계에서 판매자가 구매자 지정을 취소합니다.
 */
export const cancelSelection = async (orderId: string): Promise<Order> => {
  const { data } = await privateApiClient.delete<Order>(
    API_PATHS.order.cancelSelection(orderId),
  );
  return data;
};

/**
 * 구매자가 결제를 완료하고 배송지 정보를 등록합니다.
 */
export const confirmPayment = async (
  orderId: string,
  params: ConfirmPaymentParams,
): Promise<Order> => {
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.pay(orderId),
    params,
  );
  return data;
};

/**
 * 판매자가 택배사 및 운송장 번호를 등록하여 배송을 시작합니다.
 */
export const registerShipping = async (
  orderId: string,
  params: RegisterShippingParams,
): Promise<Order> => {
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.ship(orderId),
    params,
  );
  return data;
};

/**
 * 구매자가 배송 완료 후 구매를 확정합니다.
 */
export const confirmPurchase = async (orderId: string): Promise<Order> => {
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.confirm(orderId),
  );
  return data;
};

/**
 * 구매자가 구매확정을 거부하고 이의를 제기(분쟁)합니다.
 */
export const disputeOrder = async (
  orderId: string,
  params: DisputeOrderParams,
): Promise<Order> => {
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.dispute(orderId),
    params,
  );
  return data;
};

/**
 * 배송 전 단계 또는 분쟁 단계에서 주문을 취소합니다.
 */
export const cancelOrder = async (
  orderId: string,
  params?: CancelOrderParams,
): Promise<Order> => {
  const { data } = await privateApiClient.post<Order>(
    API_PATHS.order.cancel(orderId),
    params,
  );
  return data;
};

/**
 * 내 구매 주문 목록을 조회합니다.
 */
export const getMyPurchases = async (
  params?: QueryOrderParams,
): Promise<GetOrdersResponse> => {
  const { data } = await privateApiClient.get<GetOrdersResponse>(
    API_PATHS.order.myPurchases,
    { params },
  );
  return data;
};

/**
 * 내 판매 주문 목록을 조회합니다.
 */
export const getMySales = async (
  params?: QueryOrderParams,
): Promise<GetOrdersResponse> => {
  const { data } = await privateApiClient.get<GetOrdersResponse>(
    API_PATHS.order.mySales,
    { params },
  );
  return data;
};

/**
 * 주문 상세 정보를 조회합니다.
 */
export const getOrder = async (orderId: string): Promise<Order> => {
  const { data } = await privateApiClient.get<Order>(
    API_PATHS.order.detail(orderId),
  );
  return data;
};

/**
 * 채팅방의 활성/최근 주문 정보를 조회합니다.
 */
export const getActiveOrderByRoom = async (
  roomId: number,
): Promise<Order | null> => {
  const { data } = await privateApiClient.get<Order | null>(
    API_PATHS.order.byRoom(roomId),
  );
  return data;
};

/**
 * 구매확정 완료된 주문에 대해 거래 후기를 작성합니다.
 */
export const createTradeReview = async (
  params: CreateTradeReviewParams,
): Promise<TradeReview> => {
  const { data } = await privateApiClient.post<TradeReview>(
    API_PATHS.tradeReview.base,
    params,
  );
  return data;
};

/**
 * 작성한 거래 후기를 수정합니다.
 */
export const updateTradeReview = async (
  reviewId: number,
  params: UpdateTradeReviewParams,
): Promise<TradeReview> => {
  const { data } = await privateApiClient.patch<TradeReview>(
    API_PATHS.tradeReview.detail(reviewId),
    params,
  );
  return data;
};

/**
 * 특정 판매자가 받은 거래 후기 목록을 조회합니다.
 */
export const getUserTradeReviews = async (
  handle: string,
  params?: QueryTradeReviewParams,
): Promise<GetTradeReviewsResponse> => {
  const { data } = await publicApiClient.get<GetTradeReviewsResponse>(
    API_PATHS.tradeReview.userReviews(handle),
    { params },
  );
  return data;
};

/**
 * 특정 판매자의 거래 통계 및 신뢰 지표를 조회합니다.
 */
export const getSellerStats = async (
  handle: string,
): Promise<SellerTradeStats> => {
  const { data } = await publicApiClient.get<SellerTradeStats>(
    API_PATHS.tradeReview.sellerStats(handle),
  );
  return data;
};
