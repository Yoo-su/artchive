import { useNotificationsInfiniteQuery as useBaseNotifications, useUnreadCountQuery as useBaseUnreadCount } from "@bookjeok/react-query";

import { privateAxios } from "@/shared/libs/axios";

export type { Notification, NotificationResponse } from "@bookjeok/core";

export const useNotifications = (limit = 10) =>
  useBaseNotifications(privateAxios, limit);

export const useUnreadCount = () =>
  useBaseUnreadCount(privateAxios);
