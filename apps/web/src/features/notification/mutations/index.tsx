import {
  useDeleteNotificationMutation as useSharedDeleteNotificationMutation,
  useMarkAllNotificationsAsReadMutation as useSharedMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation as useSharedMarkNotificationAsReadMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * 알림 읽음 처리 뮤테이션 훅
 */
export const useMarkAsRead = () => {
  return useSharedMarkNotificationAsReadMutation();
};

/**
 * 모든 알림 읽음 처리 뮤테이션 훅
 */
export const useMarkAllAsRead = () => {
  const t = useTranslations("notification.toast");
  return useSharedMarkAllNotificationsAsReadMutation({
    onSuccess: () => {
      toast.success(t("read_all_success"));
    },
  });
};

/**
 * 알림 삭제 뮤테이션 훅
 */
export const useDeleteNotification = () => {
  const t = useTranslations("notification.toast");
  return useSharedDeleteNotificationMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
  });
};
