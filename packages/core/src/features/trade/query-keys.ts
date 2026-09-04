import { createQueryKeys } from "@lukemorales/query-key-factory";

import { QueryMyCompletionsParams, QueryTradeReviewParams } from "./types";

/**
 * 거래 완료 관련 쿼리 키 팩토리
 */
export const tradeKeys = createQueryKeys("trade", {
  myCompletions: (params?: QueryMyCompletionsParams) => ({
    queryKey: [params],
  }),
  completionByRoom: (roomId: number) => ({
    queryKey: [roomId],
  }),
  completionDetail: (completionId: number) => ({
    queryKey: [completionId],
  }),
  candidates: (saleId: number) => ({
    queryKey: [saleId],
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
  eligibility: (completionId: number) => ({
    queryKey: [completionId],
  }),
});
