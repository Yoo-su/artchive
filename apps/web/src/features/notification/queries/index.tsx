import { useNotificationsInfiniteQuery as useBaseNotifications, useUnreadCountQuery as useBaseUnreadCount } from "@bookjeok/react-query";

export type { Notification, NotificationResponse } from "@bookjeok/core";

export const useNotifications = (limit = 10) =>
  useBaseNotifications(limit);

export const useUnreadCount = () =>
  useBaseUnreadCount();
