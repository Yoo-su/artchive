"use client";

import { useMarkRoomAsReadMutation } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { markRoomReadInCache } from "../utils/chat-cache-utils";

/**
 * 채팅방을 읽음 처리합니다.
 * 안 읽음 배지는 캐시에서 즉시 제거(낙관적)하고 서버 기록은 소켓으로 전송하며,
 * 소켓이 끊긴 경우에만 HTTP로 대체해 중복 전송을 방지합니다.
 */
export const useMarkRoomAsRead = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { mutate: markRoomAsReadViaHttp } = useMarkRoomAsReadMutation();

  return useCallback(
    (roomId: number) => {
      markRoomReadInCache(queryClient, roomId);

      if (socket?.connected) {
        socket.emit("markAsRead", { roomId });
        return;
      }

      markRoomAsReadViaHttp(roomId);
    },
    [socket, queryClient, markRoomAsReadViaHttp],
  );
};
