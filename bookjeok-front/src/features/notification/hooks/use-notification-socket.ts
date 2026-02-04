import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { notificationKeys } from "../constants/query-keys";
import { Notification } from "../types";
import { getNotificationMessageParams } from "../utils";

export const useNotificationSocket = () => {
  const t = useTranslations("notification");
  const { socket, isConnected } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (notification: Notification) => {
      // 알림 목록 쿼리 무효화 (새로고침)
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });

      // 읽지 않은 알림 개수 갱신
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });

      // 토스트 메시지 생성 및 표시
      const { key, params } = getNotificationMessageParams(notification);
      const message = t(key, params);

      toast(t("title"), {
        description: message,
        action: {
          label: t("action_view"),
          onClick: () => {
            // 클릭 시 동작 (현재는 빈 함수, 추후 라우팅 등 추가 가능)
          },
        },
      });
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket, isConnected, queryClient, t]);
};
