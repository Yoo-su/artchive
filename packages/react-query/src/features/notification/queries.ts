"use client";

import {
  getNotifications,
  getUnreadNotificationCount,
} from "@bookjeok/api-client";
import { notificationKeys } from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

/**
 * 알림 목록 조회
 */
export const useNotificationsQuery = (cursor?: number, limit?: number) => {
  return useQuery({
    queryKey: notificationKeys.list(cursor).queryKey,
    queryFn: () => getNotifications({ cursor, limit }),
  });
};

/**
 * 알림 목록 무한 스크롤 조회
 */
export const useNotificationsInfiniteQuery = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(undefined).queryKey,
    queryFn: ({ pageParam }) =>
      getNotifications({ cursor: pageParam as number | undefined, limit }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/**
 * 안 읽은 알림 개수 조회
 */
export const useUnreadCountQuery = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: () => getUnreadNotificationCount(),
    staleTime: Infinity,
  });
};

/**
 * 안 읽은 알림 개수 조회 (1분마다 폴링)
 */
export const useUnreadNotificationCountQuery = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  });
};
