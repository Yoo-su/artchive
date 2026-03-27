import { useNotificationsInfiniteQuery as useBaseNotifications, useUnreadCountQuery as useBaseUnreadCount } from "@bookjeok/react-query/notification";

import { privateAxios } from "@/shared/libs/axios";

export type { Notification, NotificationResponse } from "@bookjeok/core/notification";

export const useNotifications = (limit = 10) =>
  useBaseNotifications(privateAxios, limit);

export const useUnreadCount = () =>
  useBaseUnreadCount(privateAxios);
