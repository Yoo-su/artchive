"use client";

import {
  getActiveOrderByRoom,
  getMyPurchases,
  getMySales,
  getOrder,
} from "@bookjeok/api-client";
import { orderKeys, QueryOrderParams } from "@bookjeok/core";
import { useQuery } from "@tanstack/react-query";

/**
 * 내 구매 주문 목록 조회 (10초 주기 폴링)
 */
export const useMyPurchasesQuery = (
  params?: QueryOrderParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: any) => number | false);
  },
) => {
  return useQuery({
    queryKey: orderKeys.myPurchases(params).queryKey,
    queryFn: () => getMyPurchases(params),
    enabled: options?.enabled ?? true,
    staleTime: 10 * 1000,
    refetchInterval:
      options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
  });
};

/**
 * 내 판매 주문 목록 조회 (10초 주기 폴링)
 */
export const useMySalesOrdersQuery = (
  params?: QueryOrderParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: any) => number | false);
  },
) => {
  return useQuery({
    queryKey: orderKeys.mySales(params).queryKey,
    queryFn: () => getMySales(params),
    enabled: options?.enabled ?? true,
    staleTime: 10 * 1000,
    refetchInterval:
      options?.refetchInterval !== undefined ? options.refetchInterval : 10000,
  });
};

/**
 * 주문 상세 조회 (진행 중인 주문 5초 주기 자동 폴링)
 */
export const useOrderDetailQuery = (
  orderId?: string | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: any) => number | false);
  },
) => {
  return useQuery({
    queryKey: orderId
      ? orderKeys.detail(orderId).queryKey
      : ["order", "detail", ""],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId && (options?.enabled ?? true),
    staleTime: 5 * 1000,
    refetchInterval:
      options?.refetchInterval !== undefined
        ? options.refetchInterval
        : (query) => {
            const data = query.state.data;
            if (!data) return 5000;
            // 완료 또는 취소된 주문은 폴링 중단
            if (data.status === "CONFIRMED" || data.status === "CANCELLED") {
              return false;
            }
            return 5000;
          },
  });
};

/**
 * 채팅방의 활성 주문 조회 (5초 주기 자동 폴링)
 */
export const useActiveOrderByRoomQuery = (
  roomId?: number | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: any) => number | false);
  },
) => {
  return useQuery({
    queryKey: roomId
      ? orderKeys.byRoom(roomId).queryKey
      : ["order", "byRoom", 0],
    queryFn: () => getActiveOrderByRoom(roomId!),
    enabled: !!roomId && (options?.enabled ?? true),
    staleTime: 5 * 1000,
    refetchInterval:
      options?.refetchInterval !== undefined ? options.refetchInterval : 5000,
  });
};
