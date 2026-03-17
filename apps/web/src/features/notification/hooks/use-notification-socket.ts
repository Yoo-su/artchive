import { useEffect } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { useNotificationActions } from "./use-notification-actions";

export const useNotificationSocket = () => {
  const { socket, isConnected } = useSocketContext();
  const { handleNewNotification } = useNotificationActions();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // 소켓 이벤트 연결만 담당
    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, isConnected, handleNewNotification]);
};
