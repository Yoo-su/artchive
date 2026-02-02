"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { notificationKeys } from "../constants/query-keys";
import { Notification } from "../types";
import { getNotificationMessageParams } from "../utils";

export const NotificationProvider = () => {
  const t = useTranslations("notification");
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });

      const { key, params } = getNotificationMessageParams(notification);
      const message = t(key, params);

      toast(t("title"), {
        description: message,
        action: {
          label: t("action_view"),
          onClick: () => {},
        },
      });
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket, isConnected, queryClient]);

  return null;
};
