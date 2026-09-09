"use client";

import {
  cancelSaleReservation,
  completeDirectTrade,
  createTradeReview,
  reserveSaleForBuyer,
  updateTradeReview,
} from "@bookjeok/api-client";
import {
  bookSaleKeys,
  chatKeys,
  CompleteTradeParams,
  CompleteTradeResult,
  CreateTradeReviewParams,
  orderKeys,
  ReserveSaleParams,
  tradeKeys,
  TradeReview,
  tradeReviewKeys,
  UpdateTradeReviewParams,
  UsedBookSale,
  userKeys,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useIdempotencyKeys } from "../../shared/use-idempotency-keys";

/**
 * 판매글 상태·채팅방 배너·내 판매글 목록이 모두 바뀌므로 함께 비운다.
 */
const invalidateTradeCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
  queryClient.invalidateQueries({ queryKey: chatKeys._def });
  queryClient.invalidateQueries({ queryKey: tradeKeys._def });
  queryClient.invalidateQueries({ queryKey: userKeys._def });
};

/**
 * 거래 상대 지정 (예약중 전환) 뮤테이션
 */
export const useReserveSaleMutation = (options?: {
  onSuccess?: (data: UsedBookSale) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (params: ReserveSaleParams) =>
      reserveSaleForBuyer(params, {
        idempotencyKey: issue(String(params.saleId)),
      }),
    onSuccess: (data, variables) => {
      release(String(variables.saleId));
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => invalidateTradeCaches(queryClient),
  });
};

/**
 * 거래 상대 지정 취소 뮤테이션
 */
export const useCancelSaleReservationMutation = (options?: {
  onSuccess?: (data: UsedBookSale) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (saleId: number) =>
      cancelSaleReservation(saleId, { idempotencyKey: issue(String(saleId)) }),
    onSuccess: (data, saleId) => {
      release(String(saleId));
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => invalidateTradeCaches(queryClient),
  });
};

/**
 * 직거래 완료 처리 뮤테이션
 */
export const useCompleteDirectTradeMutation = (options?: {
  onSuccess?: (data: CompleteTradeResult) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (params: CompleteTradeParams) =>
      completeDirectTrade(params, {
        idempotencyKey: issue(String(params.saleId)),
      }),
    onSuccess: (data, variables) => {
      release(String(variables.saleId));
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      invalidateTradeCaches(queryClient);
      // 완료와 동시에 후기를 쓸 수 있게 되므로 신뢰 지표도 갱신한다.
      queryClient.invalidateQueries({ queryKey: tradeReviewKeys._def });
    },
  });
};

/**
 * 거래 후기 작성 뮤테이션
 */
export const useCreateTradeReviewMutation = (options?: {
  onSuccess?: (data: TradeReview) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateTradeReviewParams) => createTradeReview(params),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeReviewKeys._def });
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
    },
  });
};

/**
 * 거래 후기 수정 뮤테이션
 */
export const useUpdateTradeReviewMutation = (options?: {
  onSuccess?: (data: TradeReview) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      reviewId: number;
      payload: UpdateTradeReviewParams;
    }) => updateTradeReview(params.reviewId, params.payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeReviewKeys._def });
    },
  });
};
