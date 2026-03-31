import { useDeleteNotificationMutation as useSharedDeleteNotificationMutation, useMarkAllNotificationsAsReadMutation as useSharedMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation as useSharedMarkNotificationAsReadMutation } from "@bookjeok/react-query";
import { toast } from "sonner";

import { privateAxios } from "@/shared/libs/axios";

/**
 * 알림 읽음 처리 뮤테이션 훅
 */
export const useMarkAsRead = () => {
  return useSharedMarkNotificationAsReadMutation(privateAxios);
};

/**
 * 모든 알림 읽음 처리 뮤테이션 훅
 */
export const useMarkAllAsRead = () => {
  return useSharedMarkAllNotificationsAsReadMutation(privateAxios, {
    onSuccess: () => {
      toast.success("모든 알림을 읽음 처리했습니다.");
    },
  });
};

/**
 * 알림 삭제 뮤테이션 훅
 */
export const useDeleteNotification = () => {
  return useSharedDeleteNotificationMutation(privateAxios, {
    onSuccess: () => {
      toast.success("알림이 삭제되었습니다.");
    },
  });
};
