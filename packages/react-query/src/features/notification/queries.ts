"use client";
import { deleteNotification,getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from "@bookjeok/api-client";
import { notificationKeys } from "@bookjeok/core";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam as number | undefined, limit }),
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
 * 안 읽은 알림 개수 조회
 */
export const useUnreadNotificationCountQuery = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  });
};

/**
 * 알림 읽음 처리 뮤테이션
 */
export const useMarkNotificationAsReadMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 모든 알림 읽음 처리 뮤테이션
 */
export const useMarkAllNotificationsAsReadMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 알림 삭제 뮤테이션
 */
export const useDeleteNotificationMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
