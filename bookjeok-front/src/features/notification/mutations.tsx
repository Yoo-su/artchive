import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteNotification, markAllAsRead, markAsRead } from "./apis";
import { notificationKeys } from "./constants/query-keys";

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list.queryKey,
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.unreadCount.queryKey, {
        count: 0,
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list.queryKey,
      });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.list.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount.queryKey,
      });
    },
  });
};
