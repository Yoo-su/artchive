import { createQueryKeys } from "@lukemorales/query-key-factory";

import { QueryOrderParams, QueryTradeReviewParams } from "./types";

/**
 * 주문 관련 쿼리 키 팩토리
 */
export const orderKeys = createQueryKeys("order", {
  myPurchases: (params?: QueryOrderParams) => ({
    queryKey: [params],
  }),
  mySales: (params?: QueryOrderParams) => ({
    queryKey: [params],
  }),
  detail: (orderId: string) => ({
    queryKey: [orderId],
  }),
  byRoom: (roomId: number) => ({
    queryKey: [roomId],
  }),
});

/**
 * 거래 후기 관련 쿼리 키 팩토리
 */
export const tradeReviewKeys = createQueryKeys("tradeReview", {
  userReviews: (handle: string, params?: QueryTradeReviewParams) => ({
    queryKey: [handle, params],
  }),
  sellerStats: (handle: string) => ({
    queryKey: [handle],
  }),
});
