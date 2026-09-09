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

import { useIdempotencyKeys } from "../../shared/use-idempotency-keys";

/**
 * 구매자 선택 (주문 생성) 뮤테이션
 */
export const useSelectBuyerMutation = (options?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...params
    }: CreateOrderParams & { idempotencyKey?: string }) =>
      selectBuyer(params, {
        idempotencyKey: idempotencyKey ?? issue(`sale:${params.saleId}`),
      }),
    onSuccess: (data, variables) => {
      release(`sale:${variables.saleId}`);
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
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (orderId: string) =>
      cancelSelection(orderId, { idempotencyKey: issue(orderId) }),
    onSuccess: (data, orderId) => {
      release(orderId);
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
    // 결제 승인은 새로고침으로도 다시 날아간다(성공 페이지 진입 시 자동 실행).
    // 메모리에 든 키는 새로고침을 못 넘기므로, 결제 건마다 고유하고 URL로
    // 다시 들어오는 토스 paymentKey를 그대로 멱등성 키로 쓴다.
    mutationFn: (params: { orderId: string; payload: ConfirmPaymentParams }) =>
      confirmPayment(params.orderId, params.payload, {
        idempotencyKey: params.payload.paymentKey,
      }),
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
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (params: {
      orderId: string;
      payload: RegisterShippingParams;
    }) =>
      registerShipping(params.orderId, params.payload, {
        idempotencyKey: issue(params.orderId),
      }),
    onSuccess: (data, variables) => {
      release(variables.orderId);
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
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (orderId: string) =>
      confirmPurchase(orderId, { idempotencyKey: issue(orderId) }),
    onSuccess: (data, orderId) => {
      release(orderId);
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
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (params: { orderId: string; payload: DisputeOrderParams }) =>
      disputeOrder(params.orderId, params.payload, {
        idempotencyKey: issue(params.orderId),
      }),
    onSuccess: (data, variables) => {
      release(variables.orderId);
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
  const { issue, release } = useIdempotencyKeys();

  return useMutation({
    mutationFn: (params: { orderId: string; payload?: CancelOrderParams }) =>
      cancelOrder(params.orderId, params.payload, {
        idempotencyKey: issue(params.orderId),
      }),
    onSuccess: (data, variables) => {
      release(variables.orderId);
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
