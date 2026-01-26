"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { notificationKeys } from "../constants/query-keys";
import { Notification } from "../types";
import { getNotificationMessage } from "../utils";

export const NotificationProvider = () => {
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (notification: Notification) => {
      // 1. Invalidate Queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });

      // 2. Show Toast
      const message = getNotificationMessage(notification);
      toast(message, {
        description: "새로운 알림이 도착했습니다.",
        action: {
          label: "확인",
          onClick: () => {
            // Optional: Navigate
          },
        },
      });
    };

    socket.on("newNotification", handleNotification);
    console.log("Notification Listener registered");

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket, isConnected, queryClient]);

  return null; // This component does not render anything
};
