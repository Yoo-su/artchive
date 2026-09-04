"use client";

import {
  cancelOrder,
  cancelSelection,
  confirmPayment,
  confirmPurchase,
  disputeOrder,
  registerShipping,
  selectBuyer,
} from "@bookjeok/api-client";
import {
  bookSaleKeys,
  CancelOrderParams,
  chatKeys,
  ConfirmPaymentParams,
  CreateOrderParams,
  DisputeOrderParams,
  Order,
  orderKeys,
  RegisterShippingParams,
  tradeReviewKeys,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 구매자 선택 (주문 생성) 뮤테이션
 */
export const useSelectBuyerMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...params
    }: CreateOrderParams & { idempotencyKey?: string }) =>
      selectBuyer(params, { idempotencyKey }),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};

/**
 * 구매자 선택 취소 뮤테이션
 */
export const useCancelSelectionMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelSelection(orderId),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};

/**
 * 결제 완료 확인 뮤테이션
 */
export const useConfirmPaymentMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; payload: ConfirmPaymentParams }) =>
      confirmPayment(params.orderId, params.payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};

/**
 * 운송장 등록 뮤테이션
 */
export const useRegisterShippingMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; payload: RegisterShippingParams }) =>
      registerShipping(params.orderId, params.payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
    },
  });
};

/**
 * 구매확정 뮤테이션
 */
export const useConfirmPurchaseMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => confirmPurchase(orderId),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
      queryClient.invalidateQueries({ queryKey: tradeReviewKeys._def });
    },
  });
};

/**
 * 구매확정 거부 (분쟁 제기) 뮤테이션
 */
export const useDisputeOrderMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; payload: DisputeOrderParams }) =>
      disputeOrder(params.orderId, params.payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
    },
  });
};

/**
 * 주문 취소 뮤테이션
 */
export const useCancelOrderMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { orderId: string; payload?: CancelOrderParams }) =>
      cancelOrder(params.orderId, params.payload),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys._def });
      queryClient.invalidateQueries({ queryKey: chatKeys._def });
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};
