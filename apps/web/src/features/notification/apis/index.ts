import { deleteNotification as sharedDeleteNotification, getNotifications as sharedGetNotifications, getUnreadNotificationCount as sharedGetUnreadNotificationCount, markAllNotificationsAsRead as sharedMarkAllNotificationsAsRead, markNotificationAsRead as sharedMarkNotificationAsRead } from "@bookjeok/api-client/notification";
import { GetNotificationsParams, NotificationResponse } from "@bookjeok/core/notification";

import { privateAxios } from "@/shared/libs/axios";

export const getNotifications = async (
  params?: GetNotificationsParams,
): Promise<NotificationResponse> => {
  return sharedGetNotifications(privateAxios, params ?? {});
};

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const count = await sharedGetUnreadNotificationCount(privateAxios);
  return { count };
};

export const markAsRead = async (id: number): Promise<void> => {
  return sharedMarkNotificationAsRead(privateAxios, id);
};

export const markAllAsRead = async (): Promise<void> => {
  return sharedMarkAllNotificationsAsRead(privateAxios);
};

export const deleteNotification = async (id: number): Promise<void> => {
  return sharedDeleteNotification(privateAxios, id);
};
