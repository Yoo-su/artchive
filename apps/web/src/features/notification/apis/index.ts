import { deleteNotification as sharedDeleteNotification, getNotifications as sharedGetNotifications, getUnreadNotificationCount as sharedGetUnreadNotificationCount, markAllNotificationsAsRead as sharedMarkAllNotificationsAsRead, markNotificationAsRead as sharedMarkNotificationAsRead } from "@bookjeok/api-client";
import { GetNotificationsParams, NotificationResponse } from "@bookjeok/core";

export const getNotifications = async (
  params?: GetNotificationsParams,
): Promise<NotificationResponse> => {
  return sharedGetNotifications(params ?? {});
};

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const count = await sharedGetUnreadNotificationCount();
  return { count };
};

export const markAsRead = async (id: number): Promise<void> => {
  return sharedMarkNotificationAsRead(id);
};

export const markAllAsRead = async (): Promise<void> => {
  return sharedMarkAllNotificationsAsRead();
};

export const deleteNotification = async (id: number): Promise<void> => {
  return sharedDeleteNotification(id);
};
