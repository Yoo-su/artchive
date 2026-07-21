import { API_PATHS, GetNotificationsParams, NotificationResponse } from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * 알림 목록을 조회합니다.
 */
export const getNotifications = async (
  params: GetNotificationsParams,
): Promise<NotificationResponse> => {
  const { data } = await privateApiClient.get<NotificationResponse>(
    API_PATHS.notification.base,
    { params },
  );
  return data;
};

/**
 * 특정 알림을 읽음 처리합니다.
 */
export const markNotificationAsRead = async (
  id: number,
): Promise<void> => {
  await privateApiClient.patch(API_PATHS.notification.read(id));
};

/**
 * 모든 알림을 읽음 처리합니다.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await privateApiClient.patch(API_PATHS.notification.readAll);
};

/**
 * 안 읽은 알림 개수를 조회합니다.
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  const { data } = await privateApiClient.get<{ count: number }>(
    API_PATHS.notification.unreadCount,
  );
  return data.count;
};
/**
 * 특정 알림을 삭제합니다.
 */
export const deleteNotification = async (
  id: number,
): Promise<void> => {
  await privateApiClient.delete(API_PATHS.notification.base + `/${id}`);
};
