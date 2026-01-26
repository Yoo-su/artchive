import { privateAxios } from "@/shared/libs/axios";

import { GetNotificationsParams, NotificationResponse } from "../types";

export const getNotifications = async (
  params?: GetNotificationsParams,
): Promise<NotificationResponse> => {
  const { data } = await privateAxios.get("/notifications", { params });
  return data;
};

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const { data } = await privateAxios.get("/notifications/unread-count");
  return data;
};

export const markAsRead = async (id: number): Promise<void> => {
  await privateAxios.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await privateAxios.patch("/notifications/read-all");
};
