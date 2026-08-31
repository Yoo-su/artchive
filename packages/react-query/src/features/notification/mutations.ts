"use client";

import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@bookjeok/api-client";
import { notificationKeys } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 알림 읽음 처리 뮤테이션
 */
export const useMarkNotificationAsReadMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
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
export const useMarkAllNotificationsAsReadMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
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
export const useDeleteNotificationMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
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
