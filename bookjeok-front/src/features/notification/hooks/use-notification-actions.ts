import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { notificationKeys } from "../constants/query-keys";
import { Notification } from "../types";
import { getNotificationMessageParams } from "../utils";

export const useNotificationActions = () => {
  const t = useTranslations("notification");
  const queryClient = useQueryClient();

  const handleNewNotification = (notification: Notification) => {
    // 1. 데이터 갱신 (Refetch)
    queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
    queryClient.invalidateQueries({
      queryKey: notificationKeys.unreadCount(),
    });

    // 2. UI 피드백 (Toast)
    const { key, params } = getNotificationMessageParams(notification);
    const message = t(key, params);

    toast(t("title"), {
      description: message,
      action: {
        label: t("action_view"),
        onClick: () => {
          // 추후 클릭 시 라우팅 로직 추가 가능
        },
      },
    });
  };

  return {
    handleNewNotification,
  };
};
