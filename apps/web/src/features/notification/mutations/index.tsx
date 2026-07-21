import { useDeleteNotificationMutation as useSharedDeleteNotificationMutation, useMarkAllNotificationsAsReadMutation as useSharedMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation as useSharedMarkNotificationAsReadMutation } from "@bookjeok/react-query";
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
  return useSharedMarkAllNotificationsAsReadMutation({
    onSuccess: () => {
      toast.success("모든 알림을 읽음 처리했습니다.");
    },
  });
};

/**
 * 알림 삭제 뮤테이션 훅
 */
export const useDeleteNotification = () => {
  return useSharedDeleteNotificationMutation({
    onSuccess: () => {
      toast.success("알림이 삭제되었습니다.");
    },
  });
};
