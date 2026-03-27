import { API_PATHS } from "@bookjeok/core";
import { GetNotificationsParams, NotificationResponse } from "@bookjeok/core/notification";
import { AxiosInstance } from "axios";

/**
 * 알림 목록을 조회합니다.
 */
export const getNotifications = async (
  client: AxiosInstance,
  params: GetNotificationsParams,
): Promise<NotificationResponse> => {
  const { data } = await client.get<NotificationResponse>(
    API_PATHS.notification.base,
    { params },
  );
  return data;
};

/**
 * 특정 알림을 읽음 처리합니다.
 */
export const markNotificationAsRead = async (
  client: AxiosInstance,
  id: number,
): Promise<void> => {
  await client.patch(API_PATHS.notification.read(id));
};

/**
 * 모든 알림을 읽음 처리합니다.
 */
export const markAllNotificationsAsRead = async (
  client: AxiosInstance,
): Promise<void> => {
  await client.patch(API_PATHS.notification.readAll);
};

/**
 * 안 읽은 알림 개수를 조회합니다.
 */
export const getUnreadNotificationCount = async (
  client: AxiosInstance,
): Promise<number> => {
  const { data } = await client.get<{ count: number }>(
    API_PATHS.notification.unreadCount,
  );
  return data.count;
};
/**
 * 특정 알림을 삭제합니다.
 */
export const deleteNotification = async (
  client: AxiosInstance,
  id: number,
): Promise<void> => {
  await client.delete(API_PATHS.notification.base + `/${id}`);
};
