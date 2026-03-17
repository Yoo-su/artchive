"use client";
import { useNotificationSocket } from "../hooks/use-notification-socket";

export const NotificationProvider = () => {
  useNotificationSocket();

  return null;
};
