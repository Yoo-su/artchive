"use client";
import { deleteNotification,getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from "@bookjeok/api-client";
import { notificationKeys } from "@bookjeok/core";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 알림 목록 조회
 */
export const useNotificationsQuery = (client: AxiosInstance, cursor?: number, limit?: number) => {
  return useQuery({
    queryKey: notificationKeys.list(cursor).queryKey,
    queryFn: () => getNotifications(client, { cursor, limit }),
  });
};

/**
 * 알림 목록 무한 스크롤 조회
 */
export const useNotificationsInfiniteQuery = (client: AxiosInstance, limit = 10) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(undefined).queryKey,
    queryFn: ({ pageParam }) => getNotifications(client, { cursor: pageParam as number | undefined, limit }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/**
 * 안 읽은 알림 개수 조회
 */
export const useUnreadCountQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: () => getUnreadNotificationCount(client),
    staleTime: Infinity,
  });
};

/**
 * 안 읽은 알림 개수 조회
 */
export const useUnreadNotificationCountQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: () => getUnreadNotificationCount(client),
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  });
};

/**
 * 알림 읽음 처리 뮤테이션
 */
export const useMarkNotificationAsReadMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markNotificationAsRead(client, id),
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
export const useMarkAllNotificationsAsReadMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(client),
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
export const useDeleteNotificationMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNotification(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
