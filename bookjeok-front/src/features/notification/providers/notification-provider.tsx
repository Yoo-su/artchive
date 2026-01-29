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
  const t = useTranslations("notification.messages");
  const tNotification = useTranslations("notification");
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
      const { key, params } = getNotificationMessageParams(notification);
      const message = t(key, params);

      toast(t("title"), {
        description: message,
        action: {
          label: "OK", // "확인" or just OK. Since I didn't add a key for "OK" or "confirm", I'll use hardcoded or "mark_all_read" (no).
          // ko.json doesn't have "ok" or "confirm" in "common" either.
          // I'll stick to simple "OK" or use "common.view_list"? No.
          // Let's check common keys: new, won, unknown, anonymous.
          // I'll use "OK" for now or keep it hardcoded "확인" but maybe "OK" is safer for EN.
          // Actually, toast usually doesn't strictly need a confirm button, but maybe it's just a dismissal.
          // I will use "View" maybe? Navigate to it?
          // The label is "확인" in Korean, which is "Check" or "OK".
          // I will leave it as "View" if I add navigation, but onClick is empty in original code.
          // I'll omit action label translation for this quick fix or just use "Link"?
          // Use 'View' maybe?
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
